import styles from '../styles/Navlinks.module.css';
import { useConnect, userSessionState } from '../lib/auth'
import { useAtom } from 'jotai'
import { StacksMainnet } from '@stacks/network'


const NavLinks = () => {

    const { handleSignOut } = useConnect()
    const [userSession] = useAtom(userSessionState)   


    return(
<div className={styles.menu}>
<div className={styles.links}>

<ul>
<li><a href="https://www.craft.do/s/j2QyMYbjo0B4Xo" target="_blank" rel="noopener noreferrer">Docs</a></li>
<li><a href="https://github.com/syvita/miamipool" target="_blank" rel="noopener noreferrer">Github</a></li>
<li><a href="https://discord.gg/hgrHcTs9YA" target="_blank" rel="noopener noreferrer">Discord</a></li>
{userSession.isUserSignedIn() &&
<li><button className={styles.signOutButton} onClick={handleSignOut}> Sign Out</button></li>
}
</ul>
</div>
</div>
    );
};

export default NavLinks