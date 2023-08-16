import { useState, useCallback } from 'react';
import SortableList, { Attributes, Listeners } from '#components/SortableList';

import styles from './index.module.css';

interface QuestionGroup {
    id: string;
    label: string;
    name: string;
    parentId: string;
    questionnaireId: string;
    relevant?: string;
}

function reorder<T extends { order?: number }>(data: T[]) {
    return data.map((v, i) => ({ ...v, order: i + 1 }));
}

const keySelector = (g: QuestionGroup) => g.id;

interface Props<P> {
    parentId: string | null;
    options: QuestionGroup[];
    renderer: (props: P & {
        listeners?: Listeners;
        attributes?: Attributes;
    }) => JSX.Element;
    rendererParams: P;
}

function TocList<P>(props: Props<P>) {
    const {
        parentId,
        options,
        renderer,
        rendererParams,
    } = props;

    const filteredOptions = options?.filter(
        (group: QuestionGroup) => group.parentId === parentId,
    );

    const [
        orderedFilteredOptions,
        setFilteredOrderedOptions,
    ] = useState<QuestionGroup[] | undefined>(filteredOptions);

    const handleGroupOrderChange = useCallback((...args: QuestionGroup[]) => {
        setFilteredOrderedOptions(args);
    }, []);

    return (
        <SortableList
            className={styles.sortableList}
            name="toc"
            onChange={handleGroupOrderChange}
            data={orderedFilteredOptions}
            keySelector={keySelector}
            renderer={renderer}
            rendererParams={rendererParams}
            direction="vertical"
            emptyMessage="No groups found"
            messageShown
            messageIconShown
            compactEmptyMessage
        />
    );
}

export default TocList;
