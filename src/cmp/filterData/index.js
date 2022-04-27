import React, { useState } from 'react';
import { Upload, Button, Table, message, Row, Col, Form, Radio, Select, Modal  } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

import './index.css';

const { Option } = Select;
const letter = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", 'Z'];

const FilterData = () => {
  const [ number, setNumber ] = useState([]);
  const [ data, setData ] = useState([]);
  const [ titleList, setTitleList ] = useState([]);
  const [ fileName, setFileName ] = useState('');

  const [form] = Form.useForm();
  const [modalForm] = Form.useForm();

  const readWorkbookFromLocalFile = (file, callback) => {
    let reader = new FileReader();
    reader.onload = function(e) {
      let data = e.target.result;
      let workbook = window.XLSX.read(data, {type: 'binary'});
      if(callback) callback(workbook);
    };
    reader.readAsBinaryString(file);
  };

  const trimNumber = (str) => { 
    return str.replace(/\d+/g,''); 
  };

  const diffList = (array, array2) => {
    let array3 = [];
    Object.keys(array).forEach((key) => {
      let stra = array[key];
      let count = 0;
      array2.forEach((j) => {
        if (stra == j) {
          count++;
        }
      })
      if (count === 0) {
        array3.push(stra);
      }
    });
    return array3;
  }

  const beforeUpload = (file) => {
    const { name }  = file;
    let filter = form.getFieldsValue().filter;
    readWorkbookFromLocalFile(file, (workbook) => {
      let Sheet1 = workbook.Sheets.Sheet1;
      let Sheet2 = workbook.Sheets.Sheet2;
      let number = [];
      let filterNumber = [];
      let data = [];
      let titleList = [];
      let filterName = null;
      if (Sheet2) {
        Object.keys(Sheet2).forEach((key) => {
          if (key.indexOf('A') > -1) {
            filterNumber.push(Sheet2[key].v)
          }
        });
      }

      if (filter === 1 && filterNumber.length === 0) {
        message.error('Sheet2暂无数据');
        return false;
      }

      Object.keys(Sheet1).forEach((key) => {
        const reg = new RegExp(/^[a-zA-Z1]{1,2}$/);
        // 标题
        if (reg.test(key)) {
          titleList.push(Sheet1[key].v);
        }
        if (key.indexOf('!') === -1 && Sheet1[key].constructor === Object && !reg.test(key)) {
          let numberKey = trimNumber(key);
          let index = key.replace(/[^0-9]/ig, "");
          if (number.indexOf(numberKey) === -1) {
            number.push(numberKey);
          }
          data[index - 1] = {
            ...data[index - 1],
            [numberKey]: Sheet1[key].v,
          }
        }
      });
      let newData = data;
      if (filter === 1) {
        Modal.confirm({
          title: '提示',
          content: <Select style={{width: 200}} placeholder="请选择使用哪一项过滤" onChange={(value) => { filterName = value }}>
            {titleList.map((item, index) => {
              return <Option key={letter[index]} value={letter[index]}>{item}</Option>
            })}
          </Select>,
          onOk: () => {
            if (filterName) {
              newData = data.filter((item) => {
                return filterNumber.indexOf(item[filterName]) > -1;
              });
              setData(newData);
              if (newData.length !== filterNumber.length) {
                let list = diffList(filterNumber, newData.map((item) => { return item[filterName]; }));
                Modal.confirm({
                  title: '提示',
                  content: `单号${list.join(',')}未能找到`,
                });
              }
            } else {
              message.error('请选择使用哪一项过滤')
            }
          }
        })
      } else {
        setData(newData);
      }
      setNumber(number)
      setTitleList(titleList)
      setFileName(name.split('.')[0]);
    });
    return false;
  };

  const getColumns = () => {
    let columns = number.map((item, index) => {
      return {
        title: titleList[index],
        dataIndex: item,
        key: index,
      }
    })
    columns.unshift({
      title: '行数',
      dataIndex: 'idnex',
      render: (data, e, index) => {
        return index + 1;
      }      
    })
    return columns;
  };

  const sheet2blob = (sheet, sheetName) => {
    sheetName = sheetName || 'sheet1';
    let workbook = {
      SheetNames: [sheetName],
      Sheets: {}
    };
    workbook.Sheets[sheetName] = sheet;
    // 生成excel的配置项
    let wopts = {
      bookType: 'xlsx', // 要生成的文件类型
      bookSST: false, // 是否生成Shared String Table，官方解释是，如果开启生成速度会下降，但在低版本IOS设备上有更好的兼容性
      type: 'binary'
    };
    let wbout = window.XLSX.write(workbook, wopts);
    let blob = new Blob([s2ab(wbout)], {type:"application/octet-stream"});
    // 字符串转ArrayBuffer
    function s2ab(s) {
      let buf = new ArrayBuffer(s.length);
      let view = new Uint8Array(buf);
      for (let i = 0; i !== s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
      return buf;
    }
    return blob;
  };


  const openDownloadDialog = (url, saveName) => {
    if(typeof url == 'object' && url instanceof Blob) {
      url = URL.createObjectURL(url); // 创建blob地址
    }
    let aLink = document.createElement('a');
    aLink.href = url;
    aLink.download = saveName || ''; // HTML5新增的属性，指定保存文件名，可以不要后缀，注意，file:///模式下不会生效
    let event;
    if(window.MouseEvent) event = new MouseEvent('click');
    else
    {
      event = document.createEvent('MouseEvents');
      event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    }
    aLink.dispatchEvent(event);
  };
  
  const exportHandler = () => {
    let newData = data.map((item) => {
      let newItem = [];
      Object.keys(item).forEach((key) => {
        newItem.push(item[key]);
      })
      return newItem;
    });
    newData.unshift(titleList);
    let sheet = window.XLSX.utils.aoa_to_sheet(newData);
    openDownloadDialog(sheet2blob(sheet), `${fileName}-NEW.xlsx`);
  };

  const calculation = () => {
    let col = form.getFieldsValue().col;
    let nameIndex = letter.indexOf(col);
    let titleName = titleList[nameIndex];
    if (col) {
      let number = 0;
      let status = true;
      data.forEach((item, index) => {
        if (!isNaN(item[col])) {
          number = (number * 10000 + item[col] * 10000) / 10000;
        } else {
          if (status) {
            message.error(`第${index + 1}行${titleName}不是一个数字，无法计算。`);
          }
          status = false;
        }
      });
      if (status) {
        message.success(`${titleName}计算结果：${number}`);
      }
    } else {
      message.error('请选择要计算的列');
    }
  }

  return(
    <div className="page">
      <h3 style={{textAlign: 'left'}}>基本配置</h3>
      {/* 配置信息 */}
      <Form initialValues={{filter: 1}} form={form}>
        <Row>
          <Col span={4}>
            <Form.Item label="是否通过表2过滤:" name="filter">
              <Radio.Group>
                <Radio value={1}>是</Radio>
                <Radio value={2}>否</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          {
            titleList.length > 0 && <Col span={4}>
              <Form.Item label="计算第几列:" name="col">
                <Select placeholder="请选择">
                  {
                    titleList.map((item, index) => {
                      return <Option key={letter[index]} key={letter[index]}>{item}</Option>
                    })
                  }
                </Select>
              </Form.Item>
            </Col>
          }
        </Row>
      </Form>
      {/* 上传 */}
      <div className="upload">
        <Upload
          beforeUpload={beforeUpload}
          fileList={[]}
        >
          <Button icon={<UploadOutlined />}>上传</Button>
        </Upload>
      </div>
      {/* 按钮列表 */}
      <div className="but-list">
        {
          data.length > 0 && <Button type="primary" onClick={exportHandler}>导出</Button>
        }
        {
          data.length > 0 && <Button style={{marginLeft: 10}} type="primary" onClick={calculation}>计算</Button>
        }
      </div>
      {/* 表单 */}
      <div className="table">
        {
          number.length > 0 && <Table
            rowKey='B'
            columns={getColumns()}
            dataSource={data}
            pagination={false}
            // rowSelection={{
            //   type: 'checkbox',
            //   onSelect: (record, selected, selectedRows, nativeEvent) => {
            //     setSelectedRows(selectedRows);
            //   },
            //   onSelectAll: (selected, selectedRows, changeRows) => {
            //     setSelectedRows(selectedRows);
            //   },
            // }}
          />
        }
      </div>
    </div>
  )
}
  

export default FilterData;