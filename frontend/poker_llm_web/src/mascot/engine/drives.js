import { mascotConfig } from "../../mascot.config.js";
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const jitter = (min, max, random) => min + random() * (max - min);
const valid = (value, fallback) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
export function readMemory(storage) {
    const fallback = {
        xPercent: mascotConfig.motion.startHorizontalPercent,
        drives: { ...mascotConfig.drives.defaults },
    };
    if (!storage)
        return fallback;
    try {
        const raw = storage.getItem(mascotConfig.storageKey);
        if (!raw)
            return fallback;
        const saved = JSON.parse(raw);
        return {
            xPercent: clamp(valid(saved.xPercent, fallback.xPercent), mascotConfig.motion.minHorizontalPercent, mascotConfig.motion.maxHorizontalPercent),
            drives: {
                energy: clamp(valid(saved.drives?.energy, fallback.drives.energy), 0, 100),
                curiosity: clamp(valid(saved.drives?.curiosity, fallback.drives.curiosity), 0, 100),
                affection: clamp(valid(saved.drives?.affection, fallback.drives.affection), 0, 100),
            },
        };
    }
    catch {
        return fallback;
    }
}
export function decayDrives(drives, minutes, sleeping) {
    const settings = mascotConfig.drives;
    drives.energy = clamp(drives.energy + (sleeping ? settings.sleepRecoveryPerMinute : -settings.energyDecayPerMinute) * minutes, 0, 100);
    drives.curiosity = clamp(drives.curiosity - settings.curiosityDecayPerMinute * minutes, 0, 100);
    drives.affection = clamp(drives.affection - settings.affectionDecayPerMinute * minutes, 0, 100);
}
