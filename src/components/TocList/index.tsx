import React, { useCallback } from 'react';
import {
    GrDrag,
} from 'react-icons/gr';
import {
    isNotDefined,
    _cs,
    isDefined,
} from '@togglecorp/fujs';
import {
    Container,
    Checkbox,
    QuickActionButton,
} from '@the-deep/deep-ui';
import SortableList, { Attributes, Listeners } from '#components/SortableList';

import styles from './index.module.css';

type QuestionGroup = {
    key: string;
    parentKeys: string[];
    label: string;
    nodes: QuestionGroup[];
};

interface TocProps {
    key: string;
    mainIndex: number;
    item: QuestionGroup;
    attributes?: Attributes;
    listeners?: Listeners;
    selectedGroups: string[];
    onOrderedOptionsChange: (newVal: QuestionGroup[] | undefined, index: number) => void;
    onSelectedGroupsChange: React.Dispatch<React.SetStateAction<string[]>>;
    onActiveTabChange: React.Dispatch<React.SetStateAction<string | undefined>>;
}

function TocRenderer(props: TocProps) {
    const {
        key,
        mainIndex,
        item,
        selectedGroups,
        onOrderedOptionsChange,
        onSelectedGroupsChange,
        onActiveTabChange,
        attributes,
        listeners,
    } = props;

    const handleGroupSelect = useCallback((val: boolean) => {
        onSelectedGroupsChange((oldVal) => {
            if (val) {
                return ([...oldVal, key]);
            }
            const newVal = [...oldVal];
            newVal.splice(oldVal.indexOf(key), 1);

            return newVal;
        });
        onActiveTabChange((oldActiveTab) => {
            if (isNotDefined(oldActiveTab) && val) {
                return key;
            }
            if (!val && oldActiveTab === key) {
                return undefined;
            }
            return oldActiveTab;
        });
    }, [
        onActiveTabChange,
        onSelectedGroupsChange,
        key,
    ]);

    const nodeList = item.nodes;

    const handleListChange = useCallback((newVal: QuestionGroup[] | undefined) => {
        onOrderedOptionsChange(newVal, mainIndex);
    }, [
        mainIndex,
        onOrderedOptionsChange,
    ]);

    return (
        <Container
            className={styles.groupItem}
            headerIcons={(
                <div className={styles.headerIcons}>
                    <QuickActionButton
                        name={key}
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
                        value={selectedGroups.includes(key)}
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
                    onActiveTabChange={onActiveTabChange}
                />
            )}
        </Container>
    );
}

const keySelector = (g: QuestionGroup) => g.key;

interface Props {
    className?: string;
    orderedOptions: QuestionGroup[] | undefined;
    onOrderedOptionsChange: (newVal: QuestionGroup[] | undefined) => void;
    selectedGroups: string[];
    onSelectedGroupsChange: React.Dispatch<React.SetStateAction<string[]>>;
    onActiveTabChange: React.Dispatch<React.SetStateAction<string | undefined>>;
}

function TocList(props: Props) {
    const {
        className,
        orderedOptions,
        onOrderedOptionsChange,
        selectedGroups,
        onSelectedGroupsChange,
        onActiveTabChange,
    } = props;

    const handleChildrenOrderChange = useCallback((
        newValue: QuestionGroup[] | undefined,
        parentIndex: number,
    ) => {
        if (!newValue) {
            return;
        }
        const newList = [...orderedOptions ?? []];
        newList[parentIndex] = {
            ...newList[parentIndex],
            nodes: newValue,
        };
        onOrderedOptionsChange(newList);
    }, [
        orderedOptions,
        onOrderedOptionsChange,
    ]);

    const tocRendererParams = useCallback((
        key: string,
        datum: QuestionGroup,
        mainIndex: number,
    ): TocProps => ({
        onOrderedOptionsChange: handleChildrenOrderChange,
        onSelectedGroupsChange,
        onActiveTabChange,
        selectedGroups,
        key,
        mainIndex,
        item: datum,
    }), [
        handleChildrenOrderChange,
        selectedGroups,
        onSelectedGroupsChange,
        onActiveTabChange,
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
