

export function findDuplicateIds(ids: string[]) {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const id of ids) {
        if (seen.has(id)) {
            duplicates.add(id);
        }

        seen.add(id);
    }

    return Array.from(duplicates);
}