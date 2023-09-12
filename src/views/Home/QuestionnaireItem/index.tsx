import {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    generatePath,
} from 'react-router-dom';
import {
    IoEllipsisVertical,
    IoDownloadOutline,
    IoEyeOutline,
    IoArrowRedoSharp,
} from 'react-icons/io5';
import {
    isNotDefined,
    isDefined,
} from '@togglecorp/fujs';
import {
    gql,
    useMutation,
    useQuery,
} from '@apollo/client';
import {
    AlertContext,
    Button,
    ButtonLikeLink,
    DateOutput,
    DropdownMenuItem,
    Header,
    Modal,
    QuickActionDropdownMenu,
    QuickActionLink,
    TextOutput,
    useAlert,
    useConfirmation,
    useModalState,
} from '@the-deep/deep-ui';

import { wrappedRoutes } from '#app/routes';
import EditQuestionnaireModal from '#components/EditQuestionnaireModal';
import {
    QuestionnairesForProjectQuery,
    DeleteQuestionnaireMutation,
    DeleteQuestionnaireMutationVariables,
    ExportQuestionnaireMutation,
    ExportQuestionnaireMutationVariables,
    ExportDetailsQuery,
    ExportDetailsQueryVariables,
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

const EXPORT_QUESTIONNAIRE = gql`
    mutation ExportQuestionnaire (
        $projectId: ID!,
        $questionnaireId: ID!,
    ) {
        private {
            projectScope(pk: $projectId) {
                createQuestionnaireExport(
                    data: {
                        questionnaire: $questionnaireId
                    }
                ) {
                    errors
                    ok
                    result {
                        enketoPreviewUrl
                        id
                        questionnaireId
                        status
                        statusDisplay
                    }
                }
            }
        }
    }
`;

const EXPORT_DETAILS = gql`
    query ExportDetails (
        $projectId: ID!,
        $exportId: ID!,
    ) {
        private {
            projectScope(pk: $projectId) {
                questionnaireExport(pk: $exportId) {
                    endedAt
                    enketoPreviewUrl
                    exportedAt
                    id
                    questionnaireId
                    status
                    startedAt
                    statusDisplay
                    xmlFile {
                        name
                        url
                    }
                    xlsxFile {
                        name
                        url
                    }
                }
            }
        }
    }
`;

const DOWNLOAD_ALERT_NAME = 'questionnaire-export-download';

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

    const {
        addAlert,
        removeAlert,
    } = useContext(AlertContext);

    const [
        exportModalShown,
        showExportModal,
        hideExportModal,
    ] = useModalState(false);

    const [
        enketoPreviewModalShown,
        showEnketoPreviewModal,
        hideEnketoPreviewModal,
    ] = useModalState(false);

    const [
        questionnaireModalShown,
        showQuestionnaireModal,
        hideQuestionnaireModal,
    ] = useModalState(false);

    const [exportIdToDownload, setExportIdToDownload] = useState<string | undefined>();

    const questionsEditLink = generatePath(
        wrappedRoutes.questionnaireEdit.absolutePath,
        {
            projectId,
            questionnaireId: questionnaireItem.id,
        },
    );

    const [
        triggerQuestionnaireExport,
    ] = useMutation<ExportQuestionnaireMutation, ExportQuestionnaireMutationVariables>(
        EXPORT_QUESTIONNAIRE,
        {
            onCompleted: (response) => {
                const exportResponse = response?.private?.projectScope?.createQuestionnaireExport;
                if (!exportResponse?.ok) {
                    alert.show(
                        'Some error occured during export.',
                        { variant: 'error' },
                    );
                    setExportIdToDownload(undefined);
                }
                if (exportResponse?.ok && exportResponse?.result?.id) {
                    setExportIdToDownload(exportResponse.result.id);
                    addAlert({
                        variant: 'info',
                        duration: Infinity,
                        name: DOWNLOAD_ALERT_NAME,
                        children: 'Please wait while the export is being prepared.',
                    });
                }
            },
            onError: () => {
                setExportIdToDownload(undefined);
                alert.show(
                    'Some error occured during export.',
                    { variant: 'error' },
                );
            },
        },
    );

    const handleQuestionnaireExport = useCallback(() => {
        if (isNotDefined(projectId)) {
            return;
        }
        triggerQuestionnaireExport({
            variables: {
                projectId,
                questionnaireId: questionnaireItem.id,
            },
        });
    }, [
        projectId,
        questionnaireItem.id,
        triggerQuestionnaireExport,
    ]);

    const exportVariables = useMemo(() => {
        if (isNotDefined(projectId) || isNotDefined(exportIdToDownload)) {
            return undefined;
        }
        return {
            projectId,
            exportId: exportIdToDownload,
        };
    }, [
        projectId,
        exportIdToDownload,
    ]);

    const {
        data: exportDetailsResponse,
        startPolling,
        stopPolling,
    } = useQuery<ExportDetailsQuery, ExportDetailsQueryVariables>(
        EXPORT_DETAILS,
        {
            skip: isNotDefined(exportVariables),
            variables: exportVariables,
            onCompleted: (response) => {
                const exportResponse = response.private.projectScope?.questionnaireExport;
                if (isNotDefined(exportResponse)) {
                    setExportIdToDownload(undefined);
                    removeAlert(DOWNLOAD_ALERT_NAME);
                    hideExportModal();
                    alert.show(
                        'There was some issue creating the export.',
                        { variant: 'error' },
                    );
                }
                if (exportResponse?.status === 'SUCCESS') {
                    showExportModal();
                    removeAlert(DOWNLOAD_ALERT_NAME);
                } else if (exportResponse?.status === 'FAILURE') {
                    hideExportModal();
                    removeAlert(DOWNLOAD_ALERT_NAME);
                    alert.show(
                        'There was some issue creating the export.',
                        { variant: 'error' },
                    );
                }
            },
        },
    );

    useEffect(
        () => {
            const shouldPoll = exportIdToDownload
                && exportDetailsResponse?.private?.projectScope?.questionnaireExport?.status !== 'SUCCESS'
                && exportDetailsResponse?.private?.projectScope?.questionnaireExport?.status !== 'FAILURE';

            if (shouldPoll) {
                startPolling(5000);
            } else {
                stopPolling();
            }
        },
        [
            exportDetailsResponse,
            exportIdToDownload,
            startPolling,
            stopPolling,
        ],
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

    const handleModalClose = useCallback(() => {
        hideExportModal();
        setExportIdToDownload(undefined);
    }, [
        hideExportModal,
    ]);

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
                            name={questionnaireItem.id}
                            onClick={handleQuestionnaireExport}
                        >
                            Export Questionnaire
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            name={undefined}
                            onClick={handleQuestionnaireExport}
                        >
                            Export questionnaire
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
            {exportModalShown && (
                <Modal
                    bodyClassName={styles.modalBody}
                    heading="Export Successful!"
                    headingSize="small"
                    onCloseButtonClick={handleModalClose}
                    size="small"
                    freeHeight
                >
                    Preview the form here:
                    <Button
                        name={undefined}
                        onClick={showEnketoPreviewModal}
                        variant="tertiary"
                        icons={<IoEyeOutline />}
                    >
                        Preview
                    </Button>
                    Download form in XML and XLSX here:
                    <div className={styles.buttons}>
                        <ButtonLikeLink
                            to={exportDetailsResponse?.private.projectScope?.questionnaireExport?.xmlFile?.url ?? ''}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="tertiary"
                            spacing="compact"
                            icons={<IoDownloadOutline />}
                        >
                            XML
                        </ButtonLikeLink>
                        <ButtonLikeLink
                            to={exportDetailsResponse?.private.projectScope?.questionnaireExport?.xlsxFile?.url ?? ''}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="tertiary"
                            spacing="compact"
                            icons={<IoDownloadOutline />}
                        >
                            XLSX
                        </ButtonLikeLink>
                    </div>
                </Modal>
            )}
            {enketoPreviewModalShown && (
                <Modal
                    bodyClassName={styles.modalBody}
                    heading="Questionnaire Preview"
                    headingSize="small"
                    onCloseButtonClick={hideEnketoPreviewModal}
                    headerActions={(
                        <QuickActionLink
                            to={exportDetailsResponse?.private.projectScope?.questionnaireExport?.enketoPreviewUrl ?? ''}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="transparent"
                            spacing="compact"
                            title="Open preview in a separate tab"
                        >
                            <IoArrowRedoSharp />
                        </QuickActionLink>
                    )}
                    size="large"
                >
                    <iframe
                        className={styles.iframe}
                        title="Visualization"
                        src={exportDetailsResponse?.private.projectScope?.questionnaireExport?.enketoPreviewUrl ?? ''}
                        sandbox="allow-scripts allow-same-origin allow-downloads"
                    />
                </Modal>
            )}
            {modal}
        </div>
    );
}

export default QuestionnaireItem;
