import { useCallback, useMemo } from 'react';
import { IoAdd } from 'react-icons/io5';
import {
    _cs,
} from '@togglecorp/fujs';
import {
    ListView,
    ExpandableContainer,
    QuickActionButton,
} from '@the-deep/deep-ui';

import {
    TocItem,
    getChildren,
} from '#utils/common';
import {
    ChoiceCollectionType,
} from '#types/common';

import LeafNode from './LeafNode';

import styles from './index.module.css';

interface QuestionRendererProps {
    item: TocItem,
    onEditQuestionClick: (val?: string | undefined) => void;
    projectId: string;
    questionnaireId: string;
    setActiveQuestionId: React.Dispatch<React.SetStateAction<string | undefined>>;
    setSelectedQuestionType: React.Dispatch<React.SetStateAction<string | undefined>>;
    level: number;
    handleQuestionAdd: (groupId: string) => void;
    addQuestionPaneShown: boolean;
    selectedGroups: string[];
    setSelectedLeafGroupId: React.Dispatch<React.SetStateAction<string | undefined>>;
    choiceCollections: ChoiceCollectionType[] | undefined;
}

function QuestionListRenderer(props: QuestionRendererProps) {
    const {
        item,
        onEditQuestionClick,
        projectId,
        selectedGroups,
        questionnaireId,
        setActiveQuestionId,
        setSelectedQuestionType,
        level,
        handleQuestionAdd,
        addQuestionPaneShown,
        setSelectedLeafGroupId,
        choiceCollections,
    } = props;

    return (
        <ExpandableContainer
            className={_cs(
                styles.item,
                item.leafNode && styles.child,
                (level === 2 && !item.leafNode) && styles.first,
                (level === 3 && !item.leafNode) && styles.second,
                (level === 4) && styles.third,
            )}
            heading={item.label}
            headingSize="extraSmall"
            headingClassName={styles.heading}
            headerClassName={styles.header}
            contentClassName={styles.content}
            headingSectionClassName={styles.headingSection}
            headerActionsContainerClassName={styles.headerActions}
            headerActions={item.leafNode && (
                <QuickActionButton
                    name={item.id}
                    title="Add questions"
                    onClick={handleQuestionAdd}
                    disabled={addQuestionPaneShown}
                >
                    <IoAdd />
                </QuickActionButton>
            )}
            expansionTriggerArea="header"
            withoutBorder
            spacing="none"
            defaultVisibility={!item.leafNode}
            disabled={!item.leafNode}
        >
            {item.leafNode
                ? (
                    <LeafNode
                        projectId={projectId}
                        questionnaireId={questionnaireId}
                        leafGroupId={item.id}
                        onEditQuestionClick={onEditQuestionClick}
                        setSelectedQuestionType={setSelectedQuestionType}
                        setActiveQuestionId={setActiveQuestionId}
                        setSelectedLeafGroupId={setSelectedLeafGroupId}
                        choiceCollections={choiceCollections}
                    />
                )
                : (
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    <QuestionList
                        data={item}
                        projectId={projectId}
                        selectedGroups={selectedGroups}
                        questionnaireId={questionnaireId}
                        onEditQuestionClick={onEditQuestionClick}
                        setActiveQuestionId={setActiveQuestionId}
                        setSelectedQuestionType={setSelectedQuestionType}
                        level={level + 1}
                        handleQuestionAdd={handleQuestionAdd}
                        addQuestionPaneShown={addQuestionPaneShown}
                        setSelectedLeafGroupId={setSelectedLeafGroupId}
                        choiceCollections={choiceCollections}
                    />
                )}
        </ExpandableContainer>
    );
}

const questionListKeySelector = (q: TocItem) => q.key;

interface Props{
    data: TocItem | undefined;
    onEditQuestionClick: (val?: string | undefined) => void;
    projectId: string;
    questionnaireId: string;
    setActiveQuestionId: React.Dispatch<React.SetStateAction<string | undefined>>;
    setSelectedQuestionType: React.Dispatch<React.SetStateAction<string | undefined>>;
    level: number;
    handleQuestionAdd: (groupId: string) => void;
    addQuestionPaneShown: boolean;
    selectedGroups: string[];
    setSelectedLeafGroupId: React.Dispatch<React.SetStateAction<string | undefined>>;
    className?: string;
    choiceCollections: ChoiceCollectionType[] | undefined;
}

function QuestionList(props: Props) {
    const {
        data,
        className,
        selectedGroups,
        onEditQuestionClick,
        projectId,
        questionnaireId,
        setActiveQuestionId,
        setSelectedQuestionType,
        level,
        handleQuestionAdd,
        addQuestionPaneShown,
        setSelectedLeafGroupId,
        choiceCollections,
    } = props;

    const questionListRendererParams = useCallback((_: string, datum: TocItem) => ({
        item: datum,
        projectId,
        questionnaireId,
        onEditQuestionClick,
        setActiveQuestionId,
        selectedGroups,
        setSelectedQuestionType,
        level,
        handleQuestionAdd,
        addQuestionPaneShown,
        setSelectedLeafGroupId,
        choiceCollections,
    }), [
        projectId,
        questionnaireId,
        selectedGroups,
        onEditQuestionClick,
        setActiveQuestionId,
        setSelectedQuestionType,
        level,
        addQuestionPaneShown,
        handleQuestionAdd,
        setSelectedLeafGroupId,
        choiceCollections,
    ]);

    const finalNodes = useMemo(() => (
        !data?.leafNode ? (
            data?.nodes?.map((item) => {
                const childIds = getChildren(item);
                const inputValue = item.leafNode
                    ? selectedGroups.includes(item.id)
                    : childIds.every((g) => selectedGroups.includes(g));

                const indeterminate = item.leafNode
                    ? false
                    : childIds.some((g) => selectedGroups.includes(g));

                return ({
                    ...item,
                    isSelected: inputValue || indeterminate,
                });
            }).filter((item) => item.isSelected)
        ) : undefined
    ), [
        data,
        selectedGroups,
    ]);

    if (data?.leafNode) {
        return (
            <QuestionListRenderer
                item={data}
                projectId={projectId}
                questionnaireId={questionnaireId}
                onEditQuestionClick={onEditQuestionClick}
                setActiveQuestionId={setActiveQuestionId}
                setSelectedQuestionType={setSelectedQuestionType}
                level={level}
                handleQuestionAdd={handleQuestionAdd}
                addQuestionPaneShown={addQuestionPaneShown}
                selectedGroups={selectedGroups}
                setSelectedLeafGroupId={setSelectedLeafGroupId}
                choiceCollections={choiceCollections}
            />
        );
    }

    return (
        <ListView
            className={_cs(className, styles.list)}
            data={finalNodes}
            keySelector={questionListKeySelector}
            rendererParams={questionListRendererParams}
            renderer={QuestionListRenderer}
            filtered={false}
            errored={false}
            pending={false}
        />
    );
}
export default QuestionList;
