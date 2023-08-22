import {
    IoDocumentTextOutline,
    IoCloudUploadSharp,
} from 'react-icons/io5';
import {
    _cs,
} from '@togglecorp/fujs';
import {
    Button,
    Element,
    TextOutput,
} from '@the-deep/deep-ui';

import styles from './index.module.css';

interface Props {
    className?: string;
    label?: string;
    hint?: string | null;
}

function FileQuestionPreview(props: Props) {
    const {
        className,
        label,
        hint,
    } = props;

    return (
        <div className={_cs(styles.preview, className)}>
            <TextOutput
                value={label ?? 'Upload files'}
                description={hint ?? 'Files'}
                spacing="none"
                block
            />
            <Element
                className={styles.uploadPreviewWrapper}
                icons={<IoDocumentTextOutline />}
                iconsContainerClassName={styles.icon}
                childrenContainerClassName={styles.uploadPreview}
            >
                <IoCloudUploadSharp />
                Drag and drop files here
                <br />
                Or
                <Button
                    name={undefined}
                    disabled
                >
                    Browse Files
                </Button>
            </Element>
        </div>
    );
}

export default FileQuestionPreview;
