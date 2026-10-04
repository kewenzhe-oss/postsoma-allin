import { mascotConfig } from "../../mascot.config.js";
export function selectBehavior(view, lastBehavior, random) {
    const candidates = mascotConfig.behaviorWheel.map((entry) => {
        let weight = entry.weight;
        if (entry.id === lastBehavior)
            weight *= 0.25;
        if (view.drives.curiosity > 70 && (entry.id === "peek_curious" || entry.id === "wander_slide"))
            weight *= 1.6;
        if (view.drives.affection > 65 && entry.id === "subtle_tilt")
            weight *= 1.3;
        if (view.drives.energy < 35 && entry.id === "wander_slide")
            weight *= 0.2;
        if (view.drives.energy < 25 && entry.id === "sprout_sway")
            weight *= 2;
        if (view.mode === "companion" && (entry.id === "peek_curious" || entry.id === "wander_slide"))
            weight = 0;
        return { id: entry.id, weight };
    });
    let roll = random() * candidates.reduce((sum, item) => sum + item.weight, 0);
    for (const candidate of candidates) {
        roll -= candidate.weight;
        if (roll < 0)
            return candidate.id;
    }
    return "sprout_sway";
}
