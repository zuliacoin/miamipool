import styles from '../styles/Navlinks.module.css';
import { useConnect, userSessionState } from '../lib/auth'
import { useAtom } from 'jotai'
import { StacksMainnet } from '@stacks/network'


const NavLinks = () => {

    const { handleSignOut } = useConnect()
    const [userSession] = useAtom(userSessionState)   


    return(
<div className={styles.links}>

<ul>
<li>Docs</li>
<li>Github</li>
<li>Discord</li>
{userSession.isUserSignedIn() &&
<li><button className={styles.signOutButton} onClick={handleSignOut}> Sign Out</button></li>
}
</ul>
</div>
    );
};

export default NavLinks