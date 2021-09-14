import styles from '../styles/Navlinks.module.css';


const NavLinks = () => {
    return(
<div className={styles.links}>

<ul>
<li>Docs</li>
<li>Changelog</li>
<li>Github</li>
<li>Discord</li>
</ul>
</div>
    );
};

export default NavLinks