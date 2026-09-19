export const SORT_TYPES = {
    NEWEST: "newest",
    NAME: "name",
};

export function sortAnimations(animations, sortType) {
    const sorted = [...animations];

    switch (sortType) {
        case SORT_TYPES.NEWEST:
            return sorted.sort(
                (a, b) =>
                    new Date(b.created_at) - new Date(a.created_at)
            );

        case SORT_TYPES.NAME:
            return sorted.sort((a, b) =>
                a.name.localeCompare(b.name, undefined, {
                    sensitivity: "base",
                    numeric: true,
                })
            );

        default:
            return sorted;
    }
}