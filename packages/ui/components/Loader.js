import styles from '../styles/Loader.module.css'

export default function Loader() {
    return (
        <div className={styles.loaderContainer}>
            <img src='loading.svg' />
        </div>
    )
}