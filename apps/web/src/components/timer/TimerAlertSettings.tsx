import { screenWakePreference, setScreenWakePreference, screenIsAwake } from "../../hooks/useWorkoutWakeLock";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { cancelDeviceTimerPush, pushPreference, registerTimerWorker, savePushPreference, setTimerPushFailed, timerDeviceId, timerPushRequest } from '../../services/timerPush';
import { prepareRestAlertAudio, timerAudioReady } from '../../utils/restTimerAlerts';
import Button from '../ui/button/Button';
import styles from './RestTimer.module.css';

export default function TimerAlertSettings() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [enabled, setEnabled] = useState(() => user ? pushPreference(user._id) : false);
    const [pending, setPending] = useState(false);
    const [status, setStatus] = useState('');
    const [wake, setWake] = useState(screenWakePreference);
    const [awake, setAwake] = useState(screenIsAwake);
    const [audioReady, setAudioReady] = useState(timerAudioReady);
    useEffect(() => {
        const unavailable = () => setStatus(t('timerAlerts.syncFailed'));
        const update = () => { setAudioReady(timerAudioReady()); setAwake(screenIsAwake()); setWake(screenWakePreference()); if (user) setEnabled(pushPreference(user._id)); };
        window.addEventListener('timer-push-unavailable', unavailable);
        window.addEventListener('storage', update);
        document.addEventListener('pointerup', update);
        window.addEventListener('focus', update);
        window.addEventListener('timer-wake-status', update);
        window.addEventListener('timer-audio-state', update);
        return () => { window.removeEventListener('timer-push-unavailable', unavailable); window.removeEventListener('storage', update); document.removeEventListener('pointerup', update); window.removeEventListener('focus', update); window.removeEventListener('timer-wake-status', update); window.removeEventListener('timer-audio-state', update); };
    }, [t, user]);
    async function togglePush() {
        if (!user || pending) return;
        prepareRestAlertAudio();
        setPending(true); setStatus('');
        try {
            if (enabled) {
                await cancelDeviceTimerPush(); savePushPreference(user._id, false); setTimerPushFailed(false); setEnabled(false);
                try {
                    const registration = await navigator.serviceWorker?.getRegistration();
                    await (await registration?.pushManager.getSubscription())?.unsubscribe();
                } catch { /* The server already revoked this device. */ }
                return;
            }
            if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) { setStatus(t('timerAlerts.install')); return; }
            if (Notification.permission === 'denied') { setStatus(t('timerAlerts.denied')); return; }
            // Request immediately in this click handler, before asynchronous setup.
            const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
            if (permission !== 'granted') { setStatus(t('timerAlerts.denied')); return; }
            const config = await timerPushRequest('/config') as { enabled: boolean; publicKey?: string };
            if (!config.enabled || !config.publicKey) { setStatus(t('timerAlerts.setup')); return; }
            const worker = await registerTimerWorker();
            await navigator.serviceWorker.ready;
            const bytes = Uint8Array.from(atob(config.publicKey.replace(/-/g, '+').replace(/_/g, '/')), character => character.charCodeAt(0));
            const subscription = await worker.pushManager.getSubscription() ?? await worker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes });
            await timerPushRequest('/subscribe', { deviceId: timerDeviceId(), subscription: subscription.toJSON() });
            savePushPreference(user._id, true); setTimerPushFailed(false); setEnabled(true); setStatus(t('timerAlerts.bestEffort'));
        } catch { setStatus(t('timerAlerts.syncFailed')); }
        finally { setPending(false); }
    }
    return <div className={styles.alertSettings}>
        <Button type="button" variant="ghost" disabled={!user || pending} onClick={() => void togglePush()}>{t(enabled ? 'timerAlerts.disablePush' : 'timerAlerts.enablePush')}</Button>
        {'wakeLock' in navigator && <label className={styles.alertToggle}><input type="checkbox" checked={wake} onChange={event => { setWake(event.target.checked); setScreenWakePreference(event.target.checked); }} />{t('timerAlerts.keepAwake')}</label>}
        <small role="status">{status || t(audioReady ? 'timerAlerts.audioReady' : 'timerAlerts.audioGesture')} {t('vibrate' in navigator ? 'timerAlerts.vibrationAvailable' : 'timerAlerts.vibrationUnavailable')}{wake && !awake ? ` ${t('timerAlerts.wakeUnavailable')}` : ''}</small>
    </div>;
}
