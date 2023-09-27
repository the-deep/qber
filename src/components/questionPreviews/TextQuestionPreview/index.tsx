import {
    MdOutlineAbc,
} from 'react-icons/md';
import {
    _cs,
} from '@togglecorp/fujs';
import {
    Element,
    TextOutput,
    TextInput,
} from '@the-deep/deep-ui';

import styles from './index.module.css';

interface Props {
    className?: string;
    label?: string;
    hint?: string | null;
}

function TextQuestionPreview(props: Props) {
    const {
        className,
        label,
        hint,
    } = props;

    return (
        <div className={_cs(styles.preview, className)}>
            <TextOutput
                label={label ?? 'Enter Question Label'}
                description={hint ?? 'Enter hint'}
                spacing="none"
                hideLabelColon
                block
            />
            <Element
                icons={<MdOutlineAbc />}
                iconsContainerClassName={styles.icon}
                childrenContainerClassName={styles.uploadPreview}
            >
                <TextInput
                    name={undefined}
                    placeholder="Enter text"
                    value={undefined}
                    readOnly
                />
            </Element>
        </div>
    );
}

export default TextQuestionPreview;
