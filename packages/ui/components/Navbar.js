import styles from '../styles/Navbar.module.css';
import Router from 'next/router';
import { useState } from 'react';
import MobileMenu from './MobileMenu';
import { useConnect, userSessionState } from '../lib/auth'
import { useAtom } from 'jotai'
import { StacksMainnet } from '@stacks/network'
const Navbar = () => {

const { handleOpenAuth } = useConnect()
const { handleSignOut } = useConnect()
const [userSession] = useAtom(userSessionState)   

    return (
<nav className={styles.navbar}>

<h1 onClick={() => { {Router.push('/')}}}className={styles.logo} >MiamiPool</h1>

<div >



</div>

<ul className={styles.links}>
    <li><a href="https://www.craft.do/s/j2QyMYbjo0B4Xo" target="_blank" rel="noopener noreferrer">Docs</a></li>
    <li><a href="https://github.com/syvita/miamipool" target="_blank" rel="noopener noreferrer">Github</a></li>
    <li><a href="https://discord.gg/hgrHcTs9YA" target="_blank" rel="noopener noreferrer">Discord</a></li>
    {userSession.isUserSignedIn() &&
        <li><button className={styles.signOutButton} onClick={handleSignOut}> Sign Out</button></li>
    }
    {!userSession.isUserSignedIn() &&
        <li><button className={styles.signOutButton} onClick={handleOpenAuth}> Sign In</button></li>
    }

</ul>

<MobileMenu/>



</nav>
  
    )
}

export default Navbar