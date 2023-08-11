import { useCallback } from 'react';
import {
    generatePath,
} from 'react-router-dom';
import {
    IoEllipsisVertical,
} from 'react-icons/io5';
import {
    isNotDefined,
    isDefined,
} from '@togglecorp/fujs';
import { gql, useMutation } from '@apollo/client';
import {
    Header,
    DateOutput,
    TextOutput,
    QuickActionDropdownMenu,
    DropdownMenuItem,
    useConfirmation,
    useAlert,
    useModalState,
} from '@the-deep/deep-ui';

import { wrappedRoutes } from '#app/routes';
import EditQuestionnaireModal from '#components/EditQuestionnaireModal';
import {
    QuestionnairesForProjectQuery,
    DeleteQuestionnaireMutation,
    DeleteQuestionnaireMutationVariables,
} from '#generated/types';

import styles from './index.module.css';

const DELETE_QUESTIONNAIRE = gql`
    mutation DeleteQuestionnaire(
        $questionnaireId: ID!,
        $projectId: ID!,
    ) {
        private {
            projectScope(pk: $projectId) {
                deleteQuestionnaire(id: $questionnaireId){
                    errors
                    ok
                }
            }
        }
    }
`;

type QuestionnaireType = NonNullable<NonNullable<NonNullable<NonNullable<QuestionnairesForProjectQuery['private']>['projectScope']>['questionnaires']>['items']>[number];
interface Props {
    questionnaireItem: QuestionnaireType;
    onQuestionnaireDeleteSuccess: () => void;
    projectId: string | undefined;
}

function QuestionnaireItem(props: Props) {
    const {
        questionnaireItem,
        onQuestionnaireDeleteSuccess,
        projectId,
    } = props;

    const alert = useAlert();

    const [
        questionnaireModalShown,
        showQuestionnaireModal,
        hideQuestionnaireModal,
    ] = useModalState(false);

    const questionsEditLink = generatePath(
        wrappedRoutes.questionnaireEdit.absolutePath,
        {
            projectId,
            questionnaireId: questionnaireItem.id,
        },
    );

    const [
        triggerQuestionnaireDelete,
        { loading: questionnaireDeletePending },
    ] = useMutation<DeleteQuestionnaireMutation, DeleteQuestionnaireMutationVariables>(
        DELETE_QUESTIONNAIRE,
        {
            onCompleted: (deleteResponse) => {
                const response = deleteResponse?.private?.projectScope?.deleteQuestionnaire;
                if (!response) {
                    return;
                }
                if (response.ok) {
                    onQuestionnaireDeleteSuccess();
                    alert.show(
                        'Questionnaire deleted.',
                        { variant: 'success' },
                    );
                } else {
                    alert.show(
                        'Failed to delete questionnaire',
                        { variant: 'error' },
                    );
                }
            },
            onError: () => {
                alert.show(
                    'Failed to delete questionnaire',
                    { variant: 'error' },
                );
            },
        },
    );

    const handleDeleteQuestionnaire = useCallback(() => {
        if (isNotDefined(projectId)) {
            return;
        }
        triggerQuestionnaireDelete({
            variables: {
                projectId,
                questionnaireId: questionnaireItem.id,
            },
        });
    }, [
        projectId,
        questionnaireItem.id,
        triggerQuestionnaireDelete,
    ]);

    const [
        modal,
        onDeleteQuestionnaireClick,
    ] = useConfirmation<undefined>({
        showConfirmationInitially: false,
        onConfirm: handleDeleteQuestionnaire,
        message: 'Are you sure you want to delete this questionnaire?',
    });

    return (
        <div className={styles.questionnaire}>
            <Header
                className={styles.heading}
                heading={questionnaireItem.title}
                headingSize="extraSmall"
                description={(
                    <TextOutput
                        label="Created"
                        value={<DateOutput value={questionnaireItem.createdAt} />}
                    />
                )}
                actions={(
                    <QuickActionDropdownMenu
                        label={<IoEllipsisVertical />}
                        variant="secondary"
                        disabled={questionnaireDeletePending}
                    >
                        <DropdownMenuItem
                            name={undefined}
                            onClick={showQuestionnaireModal}
                        >
                            Edit questionnaire
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            href={questionsEditLink}
                        >
                            Edit questions
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            name={undefined}
                            onClick={onDeleteQuestionnaireClick}
                        >
                            Delete
                        </DropdownMenuItem>
                    </QuickActionDropdownMenu>
                )}
            />
            {questionnaireModalShown && isDefined(projectId) && (
                <EditQuestionnaireModal
                    projectId={projectId}
                    questionnaireId={questionnaireItem.id}
                    onClose={hideQuestionnaireModal}
                    onSuccess={onQuestionnaireDeleteSuccess}
                />
            )}
            {modal}
        </div>
    );
}

export default QuestionnaireItem;
