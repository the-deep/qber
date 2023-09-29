import { useCallback } from 'react';
import {
    GrDrag,
} from 'react-icons/gr';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';
import {
    ExpandableContainer,
    Container,
    Checkbox,
    QuickActionButton,
} from '@the-deep/deep-ui';
import SortableList, { Attributes, Listeners } from '#components/SortableList';
import {
    TocItem,
    getChildren,
} from '#utils/common';

import styles from './index.module.css';

interface TocProps {
    itemKey: string;
    mainIndex: number;
    item: TocItem;
    attributes?: Attributes;
    listeners?: Listeners;
    onOrderedOptionsChange: (newVal: TocItem[] | undefined, index: number) => void;

    selectedGroups: string[];
    onSelectedGroupsChange: (newValue: boolean, id: string[]) => void;
}

function TocRenderer(props: TocProps) {
    const {
        itemKey,
        mainIndex,
        item,
        selectedGroups,
        onOrderedOptionsChange,
        onSelectedGroupsChange,
        attributes,
        listeners,
    } = props;

    const handleGroupSelect = useCallback((val: boolean) => {
        if (!item.leafNode) {
            const childIds = getChildren(item);
            onSelectedGroupsChange(val, childIds);
            return;
        }
        onSelectedGroupsChange(val, [item.id]);
    }, [
        item,
        onSelectedGroupsChange,
    ]);

    const nodeList = item.leafNode ? [] : item.nodes;

    const handleListChange = useCallback((newVal: TocItem[] | undefined) => {
        onOrderedOptionsChange(newVal, mainIndex);
    }, [
        mainIndex,
        onOrderedOptionsChange,
    ]);

    const childIds = getChildren(item);
    const inputValue = item.leafNode
        ? selectedGroups.includes(item.id)
        : childIds.every((g) => selectedGroups.includes(g));

    const indeterminate = item.leafNode
        ? false
        : childIds.some((g) => selectedGroups.includes(g));

    if (item.leafNode) {
        return (
            <Container
                className={styles.groupItem}
                headerIcons={(
                    <div className={styles.headerIcons}>
                        <QuickActionButton
                            name={itemKey}
                            // FIXME: use translation
                            title="Drag"
                            variant="transparent"
                            // eslint-disable-next-line react/jsx-props-no-spreading
                            {...attributes}
                            // eslint-disable-next-line react/jsx-props-no-spreading
                            {...listeners}
                        >
                            <GrDrag />
                        </QuickActionButton>
                        <Checkbox
                            name={item.key}
                            // FIXME: We are only handling childre for now
                            value={inputValue}
                            indeterminate={inputValue ? false : indeterminate}
                            onChange={handleGroupSelect}
                        />
                    </div>
                )}
                contentClassName={styles.content}
                heading={item.label}
                headingClassName={styles.heading}
                headingSize="extraSmall"
                spacing="none"
            >
                {isDefined(nodeList) && nodeList.length > 0 && (
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    <TocList
                        className={styles.nestedList}
                        orderedOptions={nodeList}
                        onOrderedOptionsChange={handleListChange}
                        selectedGroups={selectedGroups}
                        onSelectedGroupsChange={onSelectedGroupsChange}
                    />
                )}
            </Container>
        );
    }
    return (
        <ExpandableContainer
            className={styles.groupItem}
            headerIcons={(
                <div className={styles.headerIcons}>
                    <QuickActionButton
                        name={itemKey}
                        // FIXME: use translation
                        title="Drag"
                        variant="transparent"
                        // eslint-disable-next-line react/jsx-props-no-spreading
                        {...attributes}
                        // eslint-disable-next-line react/jsx-props-no-spreading
                        {...listeners}
                    >
                        <GrDrag />
                    </QuickActionButton>
                    <Checkbox
                        name={item.key}
                        // FIXME: We are only handling childre for now
                        value={inputValue}
                        indeterminate={inputValue ? false : indeterminate}
                        onChange={handleGroupSelect}
                    />
                </div>
            )}
            contentClassName={styles.content}
            heading={item.label}
            headingClassName={styles.heading}
            headingSize="extraSmall"
            headerClassName={styles.header}
            spacing="none"
            withoutBorder
        >
            {isDefined(nodeList) && nodeList.length > 0 && (
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                <TocList
                    className={styles.nestedList}
                    orderedOptions={nodeList}
                    onOrderedOptionsChange={handleListChange}
                    selectedGroups={selectedGroups}
                    onSelectedGroupsChange={onSelectedGroupsChange}
                />
            )}
        </ExpandableContainer>
    );
}

const keySelector = (g: TocItem) => g.key;

interface Props {
    className?: string;
    orderedOptions: TocItem[] | undefined;
    onOrderedOptionsChange: (newVal: TocItem[] | undefined) => void;
    selectedGroups: string[];
    onSelectedGroupsChange: (newValue: boolean, id: string[]) => void;
}

function TocList(props: Props) {
    const {
        className,
        orderedOptions,
        onOrderedOptionsChange,
        selectedGroups,
        onSelectedGroupsChange,
    } = props;

    const handleChildrenOrderChange = useCallback((
        newValue: TocItem[] | undefined,
        parentIndex: number,
    ) => {
        if (!newValue) {
            return;
        }
        const node = orderedOptions?.[parentIndex];
        if (node && !node.leafNode) {
            const newList = [...orderedOptions];
            newList[parentIndex] = {
                ...node,
                nodes: newValue,
            };
            onOrderedOptionsChange(newList);
        }
    }, [
        orderedOptions,
        onOrderedOptionsChange,
    ]);

    const tocRendererParams = useCallback((
        key: string,
        datum: TocItem,
        mainIndex: number,
    ): TocProps => ({
        onOrderedOptionsChange: handleChildrenOrderChange,
        onSelectedGroupsChange,
        selectedGroups,
        itemKey: key,
        mainIndex,
        item: datum,
    }), [
        handleChildrenOrderChange,
        selectedGroups,
        onSelectedGroupsChange,
    ]);

    return (
        <SortableList
            className={_cs(styles.sortableList, className)}
            direction="vertical"
            name="toc"
            onChange={onOrderedOptionsChange}
            data={orderedOptions}
            keySelector={keySelector}
            renderer={TocRenderer}
            rendererParams={tocRendererParams}
            emptyMessage="No groups found"
            messageShown
            compactEmptyMessage
        />
    );
}

export default TocList;
