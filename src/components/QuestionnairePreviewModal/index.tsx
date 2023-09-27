import {
    IoArrowRedoSharp,
} from 'react-icons/io5';

import {
    QuickActionLink,
    Modal,
} from '@the-deep/deep-ui';

import styles from './index.module.css';

interface Props {
    previewUrl: string;
    onClose: () => void;
}

function QuestionnairePreviewModal(props: Props) {
    const {
        previewUrl,
        onClose,
    } = props;

    return (
        <Modal
            bodyClassName={styles.modalBody}
            heading="Questionnaire Preview"
            headingSize="small"
            onCloseButtonClick={onClose}
            headerActions={(
                <QuickActionLink
                    to={previewUrl}
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
                src={previewUrl}
                sandbox="allow-scripts allow-same-origin allow-downloads"
            />
        </Modal>
    );
}

export default QuestionnairePreviewModal;
