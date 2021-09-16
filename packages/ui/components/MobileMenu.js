import styles from '../styles/MobileMenu.module.css';
import { useState } from 'react';
import NavLinks from './NavLinks';

const MobileMenu = () => {

     const [open, setOpen] = useState(false)

     const hamburgerMenu = <svg onClick= {() => {(setOpen(!open))}} xmlns="http://www.w3.org/2000/svg" className={styles.mobilebutton} fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
</svg>

    const closeMenu = <svg onClick= {() => {(setOpen(!open))}} xmlns="http://www.w3.org/2000/svg" className={styles.mobilebutton} fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
</svg>

    return (

     
<div >
{open ? closeMenu : hamburgerMenu}
 {open && <NavLinks/>}

</div>
 

    );
};


export default MobileMenu;