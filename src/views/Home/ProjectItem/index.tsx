import { _cs } from '@togglecorp/fujs';
import {
    TextOutput,
    DateOutput,
    Button,
} from '@the-deep/deep-ui';

import {
    ProjectsQuery,
} from '#generated/types';

import styles from './index.module.css';

type ProjectType = NonNullable<NonNullable<NonNullable<ProjectsQuery['private']>['projects']>['items']>[number];

interface Props {
    projectItem: ProjectType;
    onProjectItemClick: React.Dispatch<React.SetStateAction<string | undefined>>;
    activeProject: string | undefined;
}

function ProjectItem(props: Props) {
    const {
        projectItem,
        onProjectItemClick,
        activeProject,
    } = props;

    return (
        <Button
            name={projectItem.id}
            className={_cs(
                styles.projectItem,
                activeProject === projectItem.id && styles.active,
            )}
            variant="general"
            onClick={onProjectItemClick}
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
        </Button>
    );
}

export default ProjectItem;
