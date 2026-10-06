export async function runHarness({ model, message, instructions, tools, request, maxSteps = 20, maxCalls = 60, log = () => {} }) {
  const input = [{ role: 'user', content: message }];
  let calls = 0, tokens = 0;
  for (let step = 0; step < maxSteps; step++) {
    const response = await request({ model, instructions, input, tools: tools.definitions, store: false,
      include: ['reasoning.encrypted_content'], parallel_tool_calls: false });
    if (response.status !== 'completed') throw Error('Model response incomplete: ' + (response.status ?? 'unknown'));
    if (!Array.isArray(response.output)) throw Error('Invalid model output');
    tokens += response.usage?.total_tokens ?? 0;
    if (tokens > 150000) throw Error('Total token limit reached');
    input.push(...response.output); // Includes reasoning items required by subsequent turns.
    const requests = response.output.filter(item => item.type === 'function_call');
    if (!requests.length) {
      const text = response.output.filter(item => item.type === 'message').flatMap(item => item.content ?? [])
        .filter(item => item.type === 'output_text').map(item => item.text).join('\n');
      if (!text) throw Error('Model returned no final text');
      return { text, steps: step + 1, calls, tokens };
    }
    for (const call of requests) {
      if (++calls > maxCalls) throw Error('Tool call limit reached');
      let result;
      try {
        if (call.namespace && call.namespace !== 'workout') throw Error('Unknown tool namespace');
        result = { ok: true, result: await tools.execute(call.name, JSON.parse(call.arguments)) };
      }
      catch (error) { result = { ok: false, error: error.message }; }
      log({ step: step + 1, tool: call.name, ok: result.ok });
      input.push({ type: 'function_call_output', call_id: call.call_id, output: JSON.stringify(result) });
    }
    if (JSON.stringify(input).length > 500000) throw Error('Context size limit reached');
  }
  throw Error('Step limit reached; inspect the worktree before continuing');
}
export async function readResponseStream(body) {
  if (!body) throw Error('Missing response stream');
  const decoder = new TextDecoder();
  let pending = '';
  const items = new Map();
  const textParts = new Map();
  const eventTypes = new Set();
  for await (const chunk of body) {
    pending += decoder.decode(chunk, { stream: true });
    if (pending.length > 2000000) throw Error('Response event exceeded size limit');
    let boundary;
    while ((boundary = pending.search(/\r?\n\r?\n/)) >= 0) {
      const frame = pending.slice(0, boundary);
      const separator = pending.slice(boundary).match(/^\r?\n\r?\n/)[0];
      pending = pending.slice(boundary + separator.length);
      const data = frame.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
      if (!data || data === '[DONE]') continue;
      const event = JSON.parse(data);
      eventTypes.add(event.type);
      if (event.type === 'response.output_item.added' || event.type === 'response.output_item.done') {
        items.set(event.output_index, event.item);
      }
      if (event.type === 'response.function_call_arguments.delta') {
        const item = items.get(event.output_index);
        if (item) item.arguments = (item.arguments ?? '') + event.delta;
      }
      if (event.type === 'response.function_call_arguments.done') {
        const item = items.get(event.output_index);
        if (item) item.arguments = event.arguments;
      }
      if (event.type === 'response.output_text.delta' || event.type === 'response.output_text.done') {
        const key = `${event.output_index}:${event.content_index}`;
        textParts.set(key, event.type.endsWith('.done') ? event.text : (textParts.get(key) ?? '') + event.delta);
      }
      if (event.type === 'response.completed') {
        const output = event.response?.output?.length ? event.response.output : [...items.entries()].sort(([a], [b]) => a - b).map(([, item]) => item);
        for (const [key, text] of textParts) {
          const [index, contentIndex] = key.split(':').map(Number);
          const item = items.get(index);
          if (item?.type === 'message' && !item.content?.[contentIndex]?.text) {
            item.content ??= [];
            item.content[contentIndex] = { type: 'output_text', text };
          }
        }
        if (!output.length && textParts.size) output.push({ type: 'message', role: 'assistant', content: [...textParts.values()].map(text => ({ type: 'output_text', text })) });
        if (!output.length) throw Error('Completed stream contained no output. Event types: ' + [...eventTypes].join(', '));
        return { ...event.response, output };
      }
      if (['response.failed', 'response.incomplete', 'error'].includes(event.type)) {
        const code = event.response?.error?.code ?? event.error?.code ?? event.code ?? event.type;
        throw Error('ChatGPT request stopped: ' + code + '. No API-key fallback.');
      }
    }
  }
  throw Error('Stream ended without response.completed');
}
export function chatGPTRequest(session, fetchImpl = fetch) {
  if (!session?.accessToken || session.accessToken.startsWith('sk-')) throw Error('A verified ChatGPT OAuth session is required');
  return async body => {
    if (Date.now() >= session.expiresAt - 30000) throw Error('ChatGPT session expired; run again to sign in');
    // Plan usage has a narrower schema than API-key requests.
    const payload = { model: body.model, instructions: body.instructions, input: body.input,
      tools: [{ type: 'namespace', name: 'workout', description: 'Local workout development tools', tools: body.tools }],
      store: false, stream: true, include: body.include, parallel_tool_calls: false };
    const response = await fetchImpl('https://api.openai.com/v1/responses', {
      method: 'POST', headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), redirect: 'error', signal: AbortSignal.timeout(120000),
    });
    if (!response.ok) throw Error(`ChatGPT HTTP ${response.status}; check plan access/limits. No API-key fallback.`);
    return readResponseStream(response.body);
  };
}
