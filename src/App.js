import React from 'react';
import { Menu } from 'antd';
import { MenuUnfoldOutlined } from '@ant-design/icons';
import FilterData from './cmp/filterData';
import './App.css';

const App = () => {
  // const [ menuKey, setMenuKey] = useState('1');

  return(
    <div className="App">
      <div className="heder">
        <div className="heder-left">杭州旗胜仓储物流</div>
        <div className="heder-right">老褚不喝酒</div>
      </div>
      <div className="main">
        <Menu
          selectedKeys="1"
          mode="inline"
          theme="dark"
          inlineCollapsed={false}
          style={{ width: 200 }}
        >
          <Menu.Item key="1" icon={<MenuUnfoldOutlined />}>过滤导出</Menu.Item>
        </Menu>
        <div className="content">
          <FilterData />
        </div>
      </div>
    </div>
  )
}
  

export default App;