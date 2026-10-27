export const SORT_TYPES = {
    POPULAR: "popular",
    NEWEST: "newest",
    NAME: "name",
};

const createdAt = animation => Date.parse(animation.created_at) || 0;
const popularityRank = animation => Number.isFinite(animation.popularity_rank) && animation.popularity_rank > 0
    ? animation.popularity_rank : Infinity;

export function sortAnimations(animations, sortType) {
    const sorted = [...animations];

    switch (sortType) {
        case SORT_TYPES.POPULAR:
            return sorted.sort((a, b) => {
                const aRank = popularityRank(a), bRank = popularityRank(b);
                return (aRank === bRank ? 0 : aRank < bRank ? -1 : 1)
                    || createdAt(b) - createdAt(a);
            });
        case SORT_TYPES.NEWEST:
            return sorted.sort(
                (a, b) =>
                    createdAt(b) - createdAt(a)
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
