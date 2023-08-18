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
// import reorder from '#utils/common';
import {
    QuestionnaireQuery,
} from '#generated/types';

import styles from './index.module.css';

type QuestionGroup = NonNullable<NonNullable<NonNullable<NonNullable<QuestionnaireQuery['private']>['projectScope']>['groups']>['items']>[number];

interface TocProps {
    id: string;
    item: QuestionGroup;
    attributes?: Attributes;
    listeners?: Listeners;
    selectedGroups: string[];
    orderedOptions: QuestionGroup[] | undefined;
    onOrderedOptionsChange: React.Dispatch<React.SetStateAction<QuestionGroup[]>>;
    onSelectedGroupsChange: React.Dispatch<React.SetStateAction<string[]>>;
    onActiveTabChange: React.Dispatch<React.SetStateAction<string | undefined>>;
}

function TocRenderer(props: TocProps) {
    const {
        id,
        item,
        orderedOptions,
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
                return ([...oldVal, id]);
            }
            const newVal = [...oldVal];
            newVal.splice(oldVal.indexOf(id), 1);

            return newVal;
        });
        onActiveTabChange((oldActiveTab) => {
            if (isNotDefined(oldActiveTab) && val) {
                return id;
            }
            if (!val && oldActiveTab === id) {
                return undefined;
            }
            return oldActiveTab;
        });
    }, [
        onActiveTabChange,
        onSelectedGroupsChange,
        id,
    ]);

    const filteredOptions = orderedOptions?.filter((group) => id === group.parentId);

    return (
        <Container
            className={styles.groupItem}
            headerIcons={(
                <div className={styles.headerIcons}>
                    <QuickActionButton
                        name={id}
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
                        name={item.id}
                        value={selectedGroups.includes(id)}
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
            {isDefined(filteredOptions) && filteredOptions.length > 0 && (
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                <TocList
                    className={styles.nestedList}
                    parentId={item.id}
                    orderedOptions={orderedOptions}
                    onOrderedOptionsChange={onOrderedOptionsChange}
                    selectedGroups={selectedGroups}
                    onSelectedGroupsChange={onSelectedGroupsChange}
                    onActiveTabChange={onActiveTabChange}
                />
            )}
        </Container>
    );
}

const keySelector = (g: QuestionGroup) => g.id;

interface Props {
    className?: string;
    parentId: string | null;
    orderedOptions: QuestionGroup[] | undefined;
    onOrderedOptionsChange: React.Dispatch<React.SetStateAction<QuestionGroup[]>>
    selectedGroups: string[];
    onSelectedGroupsChange: React.Dispatch<React.SetStateAction<string[]>>;
    onActiveTabChange: React.Dispatch<React.SetStateAction<string | undefined>>;
}

function TocList(props: Props) {
    const {
        className,
        parentId,
        orderedOptions,
        onOrderedOptionsChange,
        selectedGroups,
        onSelectedGroupsChange,
        onActiveTabChange,
    } = props;

    const filteredOptions = orderedOptions?.filter(
        (group: QuestionGroup) => group.parentId === parentId,
    );

    const tocRendererParams = useCallback((key: string, datum: QuestionGroup): TocProps => ({
        orderedOptions,
        onOrderedOptionsChange,
        onSelectedGroupsChange,
        onActiveTabChange,
        selectedGroups,
        id: key,
        item: datum,
    }), [
        orderedOptions,
        selectedGroups,
        onSelectedGroupsChange,
        onOrderedOptionsChange,
        onActiveTabChange,
    ]);

    const handleGroupOrderChange = useCallback((oldValue: QuestionGroup[]) => {
        const nonParentOptions = orderedOptions?.filter((group) => !oldValue.includes(group)) ?? [];
        onOrderedOptionsChange([
            ...nonParentOptions,
            ...oldValue,
        ]);
    }, [
        onOrderedOptionsChange,
        orderedOptions,
    ]);

    return (
        <SortableList
            className={_cs(styles.sortableList, className)}
            direction="vertical"
            name="toc"
            onChange={handleGroupOrderChange}
            data={filteredOptions}
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
