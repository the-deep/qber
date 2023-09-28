import {
    isDefined,
} from '@togglecorp/fujs';
import {
    TextOutput,
} from '@the-deep/deep-ui';

import styles from './index.module.css';

interface Props {
    total: number;
    value: number;
}

function ProgressBar(props: Props) {
    const {
        total,
        value,
    } = props;

    const percentage = total > value
        ? (value / total) * 100
        : undefined;

    return (
        <div className={styles.progressBar}>
            <div className={styles.label}>
                <TextOutput
                    value="0 min"
                    description="Estimated time"
                    spacing="loose"
                />
            </div>
            <div className={styles.bar}>
                <div className={styles.total} />
                <div
                    className={styles.value}
                    style={{
                        width: isDefined(percentage)
                            ? `${percentage}%`
                            : '100%',
                        backgroundColor: isDefined(percentage)
                            ? 'var(--dui-color-primary)'
                            : 'var(--dui-color-negative)',
                    }}
                />
            </div>
        </div>
    );
}

export default ProgressBar;
