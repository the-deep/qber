import { useCallback } from 'react';
import {
    IoEllipsisVerticalOutline,
} from 'react-icons/io5';
import {
    generatePath,
} from 'react-router-dom';
import { _cs } from '@togglecorp/fujs';
import {
    TextOutput,
    DateOutput,
    QuickActionDropdownMenu,
    DropdownMenuItem,
} from '@the-deep/deep-ui';

import { wrappedRoutes } from '#app/routes';
import {
    ProjectsQuery,
} from '#generated/types';

import styles from './index.module.css';

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
                <TextOutput
                    value={projectItem.title}
                    description={(
                        <div className={styles.description}>
                            Created on
                            &thinsp;
                            <DateOutput value={projectItem.createdAt} />
                        </div>
                    )}
                    block
                    spacing="compact"
                />
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
