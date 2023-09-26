import { useMemo, useCallback, useState } from 'react';
import {
    IoCloseOutline,
} from 'react-icons/io5';
import { gql, useQuery } from '@apollo/client';
import {
    unique,
    _cs,
    listToGroupList,
} from '@togglecorp/fujs';
import {
    ListView,
    Button,
    Header,
    Container,
    QuickActionButton,
} from '@the-deep/deep-ui';

import Navbar from '#components/Navbar';
import {
    AboutFrameworkQuery,
    AboutFrameworkQueryVariables,
} from '#generated/types';

import QuestionsPreview from './QuestionsPreview';
import IntroText from './IntroText';
import styles from './index.module.css';

const QUESTION_BANK_ID = '1';

const ABOUT_FRAMEWORK = gql`
    query AboutFramework(
        $questionBankId: ID!,
    ){
        private {
            questionBank(pk: $questionBankId) {
                leafGroups {
                    category1
                    category1Display
                    category2
                    category2Display
                    category3
                    category3Display
                    category4
                    category4Display
                    id
                    name
                    order
                    type
                    typeDisplay
                }
            }
        }
    }
`;

type QuestionGroup = NonNullable<NonNullable<NonNullable<AboutFrameworkQuery['private']>['questionBank']>['leafGroups']>[number];

const subPillarKeySelector = (group: QuestionGroup) => group.id;

interface PillarsProps {
    pillars: QuestionGroup[];
    setRightPaneShown: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedLeafGroupIds: React.Dispatch<React.SetStateAction<string[]>>;
}

function Pillars(props: PillarsProps) {
    const {
        pillars,
        setRightPaneShown,
        setSelectedLeafGroupIds,
    } = props;

    const handleSubPillarClick = useCallback((subPillarId: string) => {
        setSelectedLeafGroupIds([subPillarId]);
        setRightPaneShown(true);
    }, [
        setSelectedLeafGroupIds,
        setRightPaneShown,
    ]);

    const pillarsRendererParams = useCallback((_: string, datum: QuestionGroup) => ({
        name: datum.id,
        className: _cs(styles.leaf, styles.button),
        children: datum.category2Display,
        onClick: handleSubPillarClick,
    }), [
        handleSubPillarClick,
    ]);

    const groupedList = useMemo(() => (
        Object.values(listToGroupList(
            unique(pillars, (item) => item.category2),
            (item) => item.category1,
            (item) => item,
        ))
    ), [
        pillars,
    ]);

    return (
        <div className={styles.pillars}>
            {groupedList?.map((group) => (
                <div className={styles.pillarItem}>
                    <div className={styles.parent}>
                        {group[0].category1Display}
                    </div>
                    <ListView
                        className={styles.subPillars}
                        data={group}
                        keySelector={subPillarKeySelector}
                        renderer={Button}
                        rendererParams={pillarsRendererParams}
                        filtered={false}
                        pending={false}
                        errored={false}
                    />
                </div>
            ))}
        </div>
    );
}

interface SubDimensionProps {
    sectors: QuestionGroup[];
    subDimension: QuestionGroup;
    subDimensionIndex: number;
    setRightPaneShown: React.Dispatch<React.SetStateAction<boolean>>;
    subDimensionsCount: number;
    setSelectedLeafGroupIds: React.Dispatch<React.SetStateAction<string[]>>;
    leafNodes: QuestionGroup[];
}

function SubDimension(props: SubDimensionProps) {
    const {
        sectors,
        setRightPaneShown,
        setSelectedLeafGroupIds,
        subDimensionsCount,
        subDimension,
        subDimensionIndex,
        leafNodes,
    } = props;

    const handleCategoryClick = useCallback((sectorId: string) => {
        setRightPaneShown(true);
        setSelectedLeafGroupIds(
            leafNodes
                .filter((item) => item.category3 === sectorId)
                .map((item) => item.id),
        );
    }, [
        leafNodes,
        setRightPaneShown,
        setSelectedLeafGroupIds,
    ]);

    return (
        <tr>
            {subDimensionIndex === 0 && (
                <td
                    className={styles.cellHeader}
                    rowSpan={subDimensionsCount}
                >
                    {subDimension.category1Display}
                </td>
            )}
            <td className={styles.cellHeader}>
                {subDimension.category2Display}
            </td>
            {sectors?.map((sector) => (sector.category3 ? (
                <td className={styles.cell}>
                    <Button
                        name={sector.category3}
                        className={_cs(styles.leaf, styles.button)}
                        spacing="loose"
                        onClick={handleCategoryClick}
                    />
                </td>
            ) : undefined))}
        </tr>
    );
}

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const {
        data: frameworkResponse,
    } = useQuery<AboutFrameworkQuery, AboutFrameworkQueryVariables>(
        ABOUT_FRAMEWORK,
        {
            variables: {
                questionBankId: QUESTION_BANK_ID,
            },
        },
    );

    const [selectedLeafGroupIds, setSelectedLeafGroupIds] = useState<string[]>([]);
    const framework = frameworkResponse?.private?.questionBank?.leafGroups;

    const getLeafNodeLabel = useCallback((leafId: string): string | undefined => {
        const leafNodeItem = framework?.find((group) => group.id === leafId);
        if (!leafNodeItem) {
            return undefined;
        }
        if (leafNodeItem.type === 'MATRIX_1D') {
            return leafNodeItem.category2Display;
        }
        return leafNodeItem.category4Display ?? '';
    }, [
        framework,
    ]);

    const pillars = useMemo((): (QuestionGroup[] | undefined) => (
        framework?.filter((group) => group.type === 'MATRIX_1D')
    ), [
        framework,
    ]);

    const dimensions = useMemo((): (QuestionGroup[]) => (
        framework?.filter((group) => group.type === 'MATRIX_2D') ?? []
    ), [
        framework,
    ]);

    const uniqueSectorList = useMemo(() => (
        unique(
            dimensions,
            (item) => item.category3 ?? '??',
        )
    ), [
        dimensions,
    ]);

    const dimensionRows = useMemo(() => (
        Object.values(listToGroupList(
            unique(dimensions, (item) => item.category2),
            (item) => item.category1,
            (item) => item,
        ))
    ), [dimensions]);

    const [
        rightPaneShown,
        setRightPaneShown,
    ] = useState<boolean>(false);

    return (
        <div className={styles.about}>
            <Navbar />
            <div className={styles.content}>
                <div className={styles.viz}>
                    <IntroText />
                    {pillars && (
                        <Pillars
                            pillars={pillars}
                            setRightPaneShown={setRightPaneShown}
                            setSelectedLeafGroupIds={setSelectedLeafGroupIds}
                        />
                    )}
                    <table className={styles.twoDTable}>
                        <thead>
                            <td className={styles.header} />
                            <td className={styles.header} />
                            {uniqueSectorList?.map((sector) => (
                                <td className={styles.header}>
                                    {sector.category3Display}
                                </td>
                            ))}
                        </thead>
                        {dimensionRows.map((subDimensionsWithinRow) => (
                            <>
                                {subDimensionsWithinRow.map((item, index) => (
                                    <SubDimension
                                        leafNodes={dimensions.filter(
                                            (dimension) => (
                                                dimension.category1 === item.category1
                                                && dimension.category2 === item.category2
                                            ),
                                        )}
                                        subDimensionsCount={subDimensionsWithinRow.length}
                                        subDimensionIndex={index}
                                        subDimension={item}
                                        sectors={uniqueSectorList}
                                        setRightPaneShown={setRightPaneShown}
                                        setSelectedLeafGroupIds={setSelectedLeafGroupIds}
                                    />
                                ))}
                            </>
                        ))}
                    </table>
                </div>
                {rightPaneShown && (
                    <div className={styles.rightPane}>
                        <Header
                            actions={(
                                <QuickActionButton
                                    name={undefined}
                                    title="Close right pane"
                                    variant="transparent"
                                    onClick={() => setRightPaneShown(false)}
                                >
                                    <IoCloseOutline />
                                </QuickActionButton>
                            )}
                            heading="Questions"
                            headingSize="small"
                        />
                        {selectedLeafGroupIds?.map((leafGroupId) => (
                            <Container
                                className={styles.questionsContainer}
                                heading={getLeafNodeLabel(leafGroupId)}
                                contentClassName={styles.questionsContent}
                                headingSize="extraSmall"
                            >
                                <QuestionsPreview
                                    leafGroupId={leafGroupId}
                                    questionBankId={QUESTION_BANK_ID}
                                />
                            </Container>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

Component.displayName = 'About';
