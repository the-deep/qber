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

type DeepNonNullable<T> = T extends object ? (
    T extends (infer K)[] ? (
        DeepNonNullable<K>[]
    ) : (
        { [P in keyof T]-?: DeepNonNullable<T[P]> }
    )
) : NonNullable<T>;

export type DeepReplace<T, A, B> = (
    DeepNonNullable<T> extends DeepNonNullable<A>
    ? B
    : (
        T extends (infer Z)[]
        ? DeepReplace<Z, A, B>[]
        : (
            T extends object
            ? { [K in keyof T]: DeepReplace<T[K], A, B> }
            : T
        )
    )
);
