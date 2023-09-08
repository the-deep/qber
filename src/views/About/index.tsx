import { useMemo, useCallback, useState } from 'react';
import {
    IoCloseOutline,
} from 'react-icons/io5';
import { gql, useQuery } from '@apollo/client';
import {
    unique,
    listToGroupList,
} from '@togglecorp/fujs';
import {
    ListView,
    Button,
    Header,
    Heading,
    QuickActionButton,
} from '@the-deep/deep-ui';

import Navbar from '#components/Navbar';
import {
    AboutFrameworkQuery,
    AboutFrameworkQueryVariables,
} from '#generated/types';

import QuestionsPreview from './QuestionsPreview';
import styles from './index.module.css';

const ABOUT_FRAMEWORK = gql`
    query AboutFramework{
        private {
            projectScope(pk: "20") {
                questionnaire(pk: "33") {
                    leafGroups {
                        id
                        name
                        order
                        category1
                        category1Display
                        category2
                        category2Display
                        category3
                        category3Display
                        category4
                        category4Display
                        type
                        typeDisplay
                        isHidden
                    }
                }
            }
        }
    }
`;

type QuestionGroup = NonNullable<NonNullable<NonNullable<NonNullable<AboutFrameworkQuery['private']>['projectScope']>['questionnaire']>['leafGroups']>[number];

interface ClickableNodeProps {
    id: string;
    label: string;
    hideLabel?: boolean;
    setRightPaneShown: React.Dispatch<React.SetStateAction<boolean>>;
    type: 'MATRIX_1D' | 'MATRIX_2D';
    setSelectedLeafGroupIds: React.Dispatch<React.SetStateAction<string[]>>;
    leafNodes?: QuestionGroup[];
}

function ClickableNode(props: ClickableNodeProps) {
    const {
        id,
        label,
        setRightPaneShown,
        type,
        hideLabel = false,
        setSelectedLeafGroupIds,
        leafNodes,
    } = props;

    const handleNodeItemClick = useCallback((key: string) => {
        setRightPaneShown(true);
        if (type === 'MATRIX_1D') {
            setSelectedLeafGroupIds([key]);
        } else {
            const filteredLeafNodeIds = leafNodes
                ?.filter((node) => node.category3 === key)
                ?.map((node) => node.id) ?? [];
            setSelectedLeafGroupIds(filteredLeafNodeIds);
        }
    }, [
        leafNodes,
        setRightPaneShown,
        setSelectedLeafGroupIds,
        type,
    ]);

    return (
        <Button
            name={id}
            className={styles.leaf}
            spacing="loose"
            onClick={handleNodeItemClick}
        >
            {hideLabel ? undefined : label}
        </Button>
    );
}

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

    const pillarsRendererParams = useCallback((_: string, datum: QuestionGroup) => ({
        id: datum.id,
        label: datum.category2Display,
        type: datum.type,
        setRightPaneShown,
        setSelectedLeafGroupIds,
    }), [
        setRightPaneShown,
        setSelectedLeafGroupIds,
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
                        renderer={ClickableNode}
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

interface SubDimensionsProps {
    subDimensions: QuestionGroup[];
    sectors: QuestionGroup[];
    setRightPaneShown: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedLeafGroupIds: React.Dispatch<React.SetStateAction<string[]>>;
    leafNodes: QuestionGroup[];
}

function SubDimensions(props: SubDimensionsProps) {
    const {
        subDimensions,
        sectors,
        setRightPaneShown,
        setSelectedLeafGroupIds,
        leafNodes,
    } = props;

    return (
        <>
            {subDimensions.map((group, index) => (
                <tr>
                    {index === 0 && (
                        <td
                            rowSpan={subDimensions.length}
                        >
                            {group.category1Display}
                        </td>
                    )}
                    <td>
                        {group.category2Display}
                    </td>
                    {sectors?.map((sector) => (
                        <td>
                            <ClickableNode
                                id={sector.category3 ?? ''}
                                label={sector.category3Display ?? '??'}
                                setRightPaneShown={setRightPaneShown}
                                type={sector.type}
                                leafNodes={leafNodes.filter(
                                    (node) => node.category2 === group.category2,
                                )}
                                setSelectedLeafGroupIds={setSelectedLeafGroupIds}
                                hideLabel
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const {
        data: frameworkResponse,
    } = useQuery<AboutFrameworkQuery, AboutFrameworkQueryVariables>(
        ABOUT_FRAMEWORK,
    );

    const [selectedLeafGroupIds, setSelectedLeafGroupIds] = useState<string[]>([]);
    const framework = frameworkResponse?.private?.projectScope?.questionnaire?.leafGroups;

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

    console.log('label', getLeafNodeLabel('1745'));
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
                    {pillars && (
                        <Pillars
                            pillars={pillars}
                            setRightPaneShown={setRightPaneShown}
                            setSelectedLeafGroupIds={setSelectedLeafGroupIds}
                        />
                    )}
                    <table className={styles.twoDTable}>
                        <thead>
                            <td />
                            <td />
                            {uniqueSectorList?.map((sector) => (
                                <td>
                                    {sector.category3Display}
                                </td>
                            ))}
                        </thead>
                        {dimensionRows.map((rowItem) => (
                            <SubDimensions
                                leafNodes={dimensions.filter(
                                    (dimension) => dimension.category1 === rowItem[0].category1,
                                )}
                                subDimensions={rowItem}
                                sectors={uniqueSectorList}
                                setRightPaneShown={setRightPaneShown}
                                setSelectedLeafGroupIds={setSelectedLeafGroupIds}
                            />
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
                        />
                        <div className={styles.questionGroups}>
                            {selectedLeafGroupIds?.map((leafGroupId) => (
                                <>
                                    <Heading
                                        className={styles.heading}
                                        size="extraSmall"
                                    >
                                        {getLeafNodeLabel(leafGroupId)}
                                    </Heading>
                                    <QuestionsPreview
                                        id={leafGroupId}
                                    />
                                </>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

Component.displayName = 'About';
