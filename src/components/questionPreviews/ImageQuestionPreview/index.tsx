import {
    IoCameraOutline,
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

function ImageQuestionPreview(props: Props) {
    const {
        className,
        label,
        hint,
    } = props;

    return (
        <div className={_cs(styles.preview, className)}>
            <TextOutput
                value={label ?? 'Upload photos'}
                description={hint ?? 'Only jpg'}
                spacing="none"
                block
            />
            <Element
                className={styles.uploadPreviewWrapper}
                icons={<IoCameraOutline />}
                iconsContainerClassName={styles.icon}
                childrenContainerClassName={styles.uploadPreview}
            >
                <IoCloudUploadSharp />
                Drag and drop photo here
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

export default ImageQuestionPreview;
