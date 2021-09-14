import styles from '../styles/Navbar.module.css';
import { useState } from 'react';
import MobileMenu from './MobileMenu';
const Navbar = () => {



    return (
<nav className={styles.navbar}>
<h1 className={styles.logo} >MiamiPool</h1>
<div >



</div>

<ul className={styles.links}>
<li>Docs</li>
<li>Changelog</li>
<li>Github</li>
<li>Discord</li>
</ul>

<MobileMenu/>



</nav>
  
    )
}

export default Navbar