import { useCallback, useMemo } from 'react';
import {
    IoEllipsisVerticalOutline,
} from 'react-icons/io5';
import {
    generatePath,
} from 'react-router-dom';
import {
    _cs,
    isNotDefined,
} from '@togglecorp/fujs';
import {
    DropdownMenuItem,
    Header,
    QuickActionDropdownMenu,
    TextOutput,
} from '@the-deep/deep-ui';
import {
    gql,
    useQuery,
} from '@apollo/client';

import { wrappedRoutes } from '#app/routes';
import {
    ProjectsQuery,
} from '#generated/types';

import styles from './index.module.css';

const PROJECT_INFO = gql`
    query ProjectInfo(
        $projectId: ID!,
    ) {
        private {
            id
            projectScope(pk: $projectId) {
                id
                project {
                    id
                    members {
                        count
                    }
                }
                questionnaires {
                    count
                }
            }
        }
    }
`;

type ProjectType = NonNullable<NonNullable<NonNullable<ProjectsQuery['private']>['projects']>['items']>[number];

interface Props {
    projectItem: ProjectType;
    onProjectItemClick: React.Dispatch<React.SetStateAction<string | undefined>>;
    projectId: string;
    activeProject: string | undefined;
}

function ProjectItem(props: Props) {
    const {
        projectItem,
        onProjectItemClick,
        projectId,
        activeProject,
    } = props;

    const variables = useMemo(() => {
        if (isNotDefined(projectId)) {
            return undefined;
        }
        return ({
            projectId,
        });
    }, [
        projectId,
    ]);

    const {
        data: projectInfoResponse,
    } = useQuery(
        PROJECT_INFO,
        {
            skip: isNotDefined(variables),
            variables,
        },
    );

    const questionnairesCount = projectInfoResponse?.private?.projectScope?.questionnaires.count;
    const membersCount = projectInfoResponse?.private?.projectScope?.project.members.count;

    const link = generatePath(wrappedRoutes.projectEdit.absolutePath, { projectId });

    const handleProjectItemClick = useCallback(() => {
        onProjectItemClick(projectId);
    }, [
        onProjectItemClick,
        projectId,
    ]);

    return (
        <div
            id={projectId}
            className={_cs(
                styles.projectItem,
                activeProject === projectItem.id && styles.active,
            )}
        >
            <div
                className={styles.clickable}
                onClick={handleProjectItemClick}
                role="presentation"
            >
                <Header
                    headingSize="extraSmall"
                    heading={projectItem.title}
                />
                <div className={styles.description}>
                    <TextOutput
                        className={styles.stats}
                        value={questionnairesCount}
                        description={questionnairesCount > 1 ? 'Forms' : 'Form'}
                        valueType="number"
                    />
                    <TextOutput
                        className={styles.stats}
                        value={membersCount}
                        description={membersCount > 1 ? 'Users' : 'User'}
                        valueType="number"
                    />
                </div>
                <div className={styles.description}>
                    <TextOutput
                        className={styles.stats}
                        label="Created on"
                        value={projectItem.createdAt}
                        valueType="date"
                    />
                </div>
            </div>
            <QuickActionDropdownMenu
                className={styles.menu}
                label={<IoEllipsisVerticalOutline />}
            >
                <DropdownMenuItem
                    href={link}
                >
                    Edit Project
                </DropdownMenuItem>
            </QuickActionDropdownMenu>
        </div>
    );
}

export default ProjectItem;
