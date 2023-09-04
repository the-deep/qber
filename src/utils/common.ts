import { isDefined } from '@togglecorp/fujs';

// eslint-disable-next-line import/prefer-default-export
export function flatten<A, K>(
    lst: A[],
    valueSelector: (item: A) => K,
    childSelector: (item: A) => A[] | undefined,
): K[] {
    if (lst.length <= 0) {
        return [];
    }
    const itemsByParent = lst.map(valueSelector);
    const itemsByChildren = lst.map(childSelector).filter(isDefined).flat();
    return [
        ...itemsByParent,
        ...flatten(itemsByChildren, valueSelector, childSelector),
    ];
}
