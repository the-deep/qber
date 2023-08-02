import { useMemo, useState, useCallback } from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import { HiMiniChevronDoubleDown } from 'react-icons/hi2';
import {
    IoAdd,
    IoChevronBackOutline,
} from 'react-icons/io5';
import { gql, useQuery } from '@apollo/client';
import { isNotDefined, isDefined } from '@togglecorp/fujs';
import {
    CollapsibleContainer,
    TextInput,
    ListView,
    Button,
    Header,
    Heading,
    useModalState,
    Message,
} from '@the-deep/deep-ui';

import Navbar from '#components/Navbar';
import useDebouncedValue from '#hooks/useDebouncedValue';
import EditQuestionnaireModal from '#components/EditQuestionnaireModal';
import ProjectCreateModal from '#components/ProjectCreateModal';
import {
    ProjectsQuery,
    ProjectsQueryVariables,
    QuestionnairesForProjectQuery,
    QuestionnairesForProjectQueryVariables,
} from '#generated/types';

import QuestionnaireItem from './QuestionnaireItem';
import ProjectItem from './ProjectItem';
import styles from './index.module.css';

const PROJECTS = gql`
query Projects (
    $search: String,
    $limit: Int,
    $offset: Int,
) {
    private {
        projects (
            filters: {
                search: $search,
            },
            pagination: {
                limit: $limit,
                offset: $offset,
            },
        ) {
            items {
                createdAt
                currentUserRole
                id
                title
            }
            count
            limit
            offset
        }
    }
}
`;

const QUESTIONNAIRES_FOR_PROJECT = gql`
query QuestionnairesForProject (
    $projectId: ID!,
) {
    private {
        projectScope(pk: $projectId){
            id
            questionnaires {
                items {
                    createdAt
                    id
                    title
                    projectId
                }
                count
            }
        }
    }
}
`;

type ProjectType = NonNullable<NonNullable<NonNullable<ProjectsQuery['private']>['projects']>['items']>[number];
const projectKeySelector = (d: ProjectType) => d.id;

type QuestionnaireType = NonNullable<NonNullable<NonNullable<NonNullable<QuestionnairesForProjectQuery['private']>['projectScope']>['questionnaires']>['items']>[number];
const questionnaireKeySelector = (d: QuestionnaireType) => d.id;

const PAGE_SIZE = 20;

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [searchText, setSearchText] = useState<string | undefined>();
    const debouncedSearchText = useDebouncedValue(searchText);

    const [activeProject, setActiveProject] = useState<string | undefined>();

    const [
        questionnaireModalShown,
        showQuestionnaireModal,
        hideQuestionnaireModal,
    ] = useModalState(false);

    const [
        projectCreateModalShown,
        showProjectCreateModal,
        hideProjectCreateModal,
    ] = useModalState(false);

    const variablesForProjects = useMemo(() => ({
        search: debouncedSearchText,
        limit: PAGE_SIZE,
        offset: 0,
    }), [
        debouncedSearchText,
    ]);

    const {
        data: projectsResponse,
        loading: projectsLoading,
        fetchMore: fetchMoreProjects,
        refetch: retriggerProjectsResponse,
    } = useQuery<ProjectsQuery, ProjectsQueryVariables>(
        PROJECTS,
        {
            variables: variablesForProjects,
        },
    );

    const projects = projectsResponse?.private.projects;
    const displayedProjectsCount = (projects?.offset ?? 0) + (projects?.limit ?? 0);

    const handleShowMoreProjectsClick = useCallback(() => {
        fetchMoreProjects({
            variables: {
                ...variablesForProjects,
                offset: (projects?.offset ?? 0)
                + (projects?.limit ?? 0),
            },
            updateQuery: (previousResult, { fetchMoreResult }) => {
                if (!previousResult.private.projects) {
                    return previousResult;
                }

                const oldProjects = previousResult.private.projects.items;
                const newProjects = fetchMoreResult.private.projects.items;

                if (!newProjects) {
                    return previousResult;
                }

                const dataToReturn = {
                    ...previousResult,
                    private: {
                        ...previousResult.private,
                        projects: {
                            ...fetchMoreResult.private.projects,
                            items: [
                                ...oldProjects,
                                ...newProjects,
                            ],
                        },
                    },
                };

                return dataToReturn;
            },
        });
    }, [
        fetchMoreProjects,
        variablesForProjects,
        projects?.offset,
        projects?.limit,
    ]);

    const projectListRendererParams = useCallback((projectId: string, datum: ProjectType) => ({
        projectItem: datum,
        projectId,
        onProjectItemClick: setActiveProject,
        activeProject,
        refreshProjectList: retriggerProjectsResponse,
    }), [
        activeProject,
        retriggerProjectsResponse,
    ]);

    const activeProjectData = projects?.items.find((p) => p.id === activeProject);

    const variablesForQuestionnaires = useMemo(
        () => {
            if (isNotDefined(activeProject)) {
                return undefined;
            }
            return ({ projectId: activeProject });
        },
        [
            activeProject,
        ],
    );

    const {
        data: questionnairesResponse,
        loading: questionnairesLoading,
        refetch: retriggerQuestionnairesResponse,
    } = useQuery<QuestionnairesForProjectQuery, QuestionnairesForProjectQueryVariables>(
        QUESTIONNAIRES_FOR_PROJECT,
        {
            skip: isNotDefined(variablesForQuestionnaires),
            variables: variablesForQuestionnaires,
        },
    );

    const questionnaires = questionnairesResponse?.private.projectScope?.questionnaires.items;

    const questionnaireListRendererParams = useCallback((_: string, datum: QuestionnaireType) => ({
        questionnaireItem: datum,
        onQuestionnaireDeleteSuccess: retriggerQuestionnairesResponse,
        projectId: activeProject,
    }), [
        retriggerQuestionnairesResponse,
        activeProject,
    ]);

    return (
        <div className={styles.page}>
            <Navbar
                header={(
                    <Heading
                        size="small"
                    >
                        {activeProjectData?.title}
                    </Heading>
                )}
            />
            <div className={styles.pageContent}>

                <CollapsibleContainer
                    className={styles.leftPane}
                    expandButtonClassName={styles.expandChartsButton}
                    collapseButtonClassName={styles.collapseChartsButton}
                    heading="My Projects"
                    collapseButtonContent={<IoChevronBackOutline />}
                    expandButtonContent={(
                        <div className={styles.buttonText}>
                            Show Projects
                            <IoChevronBackOutline />
                        </div>
                    )}
                    contentClassName={styles.leftContent}
                >
                    <Button
                        className={styles.addProjectButton}
                        name={undefined}
                        icons={<IoAdd />}
                        variant="primary"
                        onClick={showProjectCreateModal}
                    >
                        Add project
                    </Button>
                    <TextInput
                        className={styles.searchField}
                        name={undefined}
                        icons={<AiOutlineSearch />}
                        placeholder="Search projects"
                        onChange={setSearchText}
                        value={searchText}
                    />
                    <ListView
                        className={styles.projects}
                        data={projects?.items}
                        keySelector={projectKeySelector}
                        renderer={ProjectItem}
                        rendererParams={projectListRendererParams}
                        borderBetweenItem
                        filtered={(searchText?.length ?? 0) > 0}
                        filteredEmptyMessage="No projects matched your keyword."
                        errored={false}
                        pending={projectsLoading}
                        messageShown
                    />
                    {displayedProjectsCount < (projects?.count ?? 0) && (
                        <Button
                            className={styles.showMoreButton}
                            variant="action"
                            name={undefined}
                            disabled={projectsLoading}
                            onClick={handleShowMoreProjectsClick}
                            actions={<HiMiniChevronDoubleDown />}
                        >
                            Show more
                        </Button>
                    )}
                </CollapsibleContainer>
                {isDefined(activeProject) && (
                    <div className={styles.content}>
                        <Header
                            headingSize="extraSmall"
                            className={styles.questionnaireHeader}
                            heading="My Questionnaires"
                            actions={(
                                <Button
                                    name={undefined}
                                    icons={<IoAdd />}
                                    onClick={showQuestionnaireModal}
                                >
                                    Create Questionnaire
                                </Button>
                            )}
                        />
                        <ListView
                            data={questionnaires}
                            keySelector={questionnaireKeySelector}
                            renderer={QuestionnaireItem}
                            rendererParams={questionnaireListRendererParams}
                            borderBetweenItem
                            filtered={false}
                            errored={false}
                            pending={questionnairesLoading}
                        />
                    </div>
                )}
                {isNotDefined(activeProject) && (
                    <Message
                        message="No project selected"
                    />
                )}
            </div>
            {questionnaireModalShown && isDefined(activeProject) && (
                <EditQuestionnaireModal
                    projectId={activeProject}
                    onClose={hideQuestionnaireModal}
                    onSuccess={retriggerQuestionnairesResponse}
                />
            )}
            {projectCreateModalShown && (
                <ProjectCreateModal
                    onClose={hideProjectCreateModal}
                    onSuccess={retriggerProjectsResponse}
                />
            )}
        </div>
    );
}

Component.displayName = 'Home';