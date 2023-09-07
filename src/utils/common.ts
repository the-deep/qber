// eslint-disable-next-line import/prefer-default-export
export function flatten<A, K>(
    list: A[],
    valueSelector: (item: A) => K,
    childSelector: (item: A) => A[],
): K[] {
    const items = list.map((item) => {
        const a = flatten(childSelector(item), valueSelector, childSelector);
        if (childSelector(item).length > 0) {
            return a;
        }
        return [valueSelector(item)];
    });

    return items.flat();
}

export type LeafTocItem = {
    key: string;
    parentKeys: string[];
    label: string;
    leafNode: true;
    id: string;
    isHidden: boolean;
};
export type NonLeafTocItem = {
    key: string;
    parentKeys: string[];
    label: string;
    leafNode?: false;
    nodes: TocItem[];
}

export type TocItem = LeafTocItem | NonLeafTocItem;

export function getChildren(item: TocItem): string[] {
    if (item.leafNode) {
        return [item.id];
    }
    return item.nodes.flatMap(getChildren);
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
