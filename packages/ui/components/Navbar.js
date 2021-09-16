import styles from '../styles/Navbar.module.css';
import Router from 'next/router';
import { useState } from 'react';
import MobileMenu from './MobileMenu';
import { useConnect, userSessionState } from '../lib/auth'
import { useAtom } from 'jotai'
import { StacksMainnet } from '@stacks/network'
const Navbar = () => {

const { handleSignOut } = useConnect()
const [userSession] = useAtom(userSessionState)   

    return (
<nav className={styles.navbar}>

<h1 onClick={() => { {Router.push('/')}}}className={styles.logo} >MiamiPool</h1>

<div >



</div>

<ul className={styles.links}>
<li>Docs</li>
<li><a href='https://github.com/syvita/miamipool'>Github</a></li>
<li>Discord</li>
{userSession.isUserSignedIn() &&
<li><button className={styles.signOutButton} onClick={handleSignOut}> Sign Out</button></li>
}

</ul>

<MobileMenu/>



</nav>
  
    )
}

export default Navbar