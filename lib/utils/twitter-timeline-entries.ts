interface TimelineEntry {
    entryId?: string;
    content?: { items?: TimelineEntry[] };
}

interface TimelineInstruction {
    type: string;
    entries?: TimelineEntry[];
    moduleItems?: TimelineEntry[];
}

// A response can contain both ordinary posts and a thread module. Neither replaces the other.
export function collectTimelineEntries(instructions: readonly TimelineInstruction[] = []): TimelineEntry[] {
    const entries = instructions.filter((instruction) => instruction.type === 'TimelineAddEntries').flatMap((instruction) => instruction.entries ?? []);
    const moduleItems = instructions.filter((instruction) => instruction.type === 'TimelineAddToModule').flatMap((instruction) => instruction.moduleItems ?? []);
    const gridEntries = entries.filter((entry) => entry.entryId === 'profile-grid-0').flatMap((entry) => entry.content?.items ?? []);
    const seen = new Set<string>();
    return [...entries, ...moduleItems, ...gridEntries].filter((entry) => {
        if (!entry.entryId) {
            return true;
        }
        if (seen.has(entry.entryId)) {
            return false;
        }
        seen.add(entry.entryId);
        return true;
    });
}
