import styles from './index.module.css';

interface Props {
    displayName?: string | null | undefined;
    emailDisplay?: string;
}

function OptionLabelSelector(props: Props) {
    const {
        displayName,
        emailDisplay,
    } = props;

    return (
        <div className={styles.option}>
            <div className={styles.displayName}>
                {displayName ?? ''}
            </div>
            {emailDisplay && (
                <div className={styles.secondary}>
                    {emailDisplay}
                </div>
            )}
        </div>
    );
}

export default OptionLabelSelector;
