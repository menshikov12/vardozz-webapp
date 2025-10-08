import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { showBackButton, hideBackButton } from '../../shared/lib/telegram';
import styles from './AdminMain.module.scss';

const AdminMain: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    showBackButton(() => {
      navigate('/');
      hideBackButton();
    });
    
    return () => {
      hideBackButton();
    };
  }, [navigate]);

  return (
    <div className={styles.mainContent}>
      <Link to="/admin/roles" className={styles.navLink}>
        <h2 className={styles.pulseTitle}>РОЛИ</h2>
      </Link>
      
      <Link to="/admin/users" className={styles.navLink}>
        <h2 className={styles.pulseTitle}>ПОЛЬЗОВАТЕЛИ</h2>
      </Link>
      
      <Link to="/admin/content" className={styles.navLink}>
        <h2 className={styles.pulseTitle}>КОНТЕНТ</h2>
      </Link>
      
      <Link to="/admin/dates" className={styles.navLink}>
        <h2 className={styles.pulseTitle}>ДАТЫ</h2>
      </Link>
      
      <Link to="/admin/prices" className={styles.navLink}>
        <h2 className={styles.pulseTitle}>ЦЕНЫ</h2>
      </Link>
    </div>
  );
};

export default AdminMain;
