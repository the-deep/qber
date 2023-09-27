import {
    MdOutlineSchedule,
} from 'react-icons/md';
import {
    _cs,
} from '@togglecorp/fujs';
import {
    Element,
    TextOutput,
    TimeInput,
} from '@the-deep/deep-ui';

import styles from './index.module.css';

interface Props {
    className?: string;
    label?: string;
    hint?: string | null;
}

function DateQuestionPreview(props: Props) {
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
                icons={<MdOutlineSchedule />}
                iconsContainerClassName={styles.icon}
                childrenContainerClassName={styles.uploadPreview}
            >
                <TimeInput
                    name={undefined}
                    placeholder="Select Date"
                    value={undefined}
                    readOnly
                />
            </Element>
        </div>
    );
}

export default DateQuestionPreview;
