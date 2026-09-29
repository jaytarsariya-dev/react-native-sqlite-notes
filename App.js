import LottieView from "lottie-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Alert, FlatList, Modal, TextInput, ToastAndroid, TouchableOpacity, View, Text, ActivityIndicator } from "react-native";
import SQLite from 'react-native-sqlite-storage';
import Icon from 'react-native-vector-icons/Fontisto';
import Icon1 from 'react-native-vector-icons/MaterialCommunityIcons';

const NotesApp = () => {

    const [data, setData] = useState([]);
    const [visible, setVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toDateString());
    const [updateId, setUpdateId] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

    const cursorRef = useRef(null);

    useEffect(() => {
        const subscribe = async () => {
            try {
                await handleDisplay();
            } catch (error) {
                alert(error.message);
            } finally {
                setLoading(false);
                setHasFetchedOnce(true);
            }
        };

        subscribe();
    }, []);

    const db = SQLite.openDatabase(
        {
            name: 'MyDatabase.db',
            location: 'default'
        },
        () => console.log('Database opened'),
        (error) => console.error('Error opening database:', error)
    );

    db.transaction((txn) => {
        txn.executeSql(
            `create table if not exists notes(id integer primary key autoincrement,title TEXT NOT NULL,description TEXT NOT NULL,date text not null)`,
            [],
            () => console.log('Table notes created successfully'),
            (error) => console.error('Error creating table notes:', error)
        );
    });

    const Display = (setData) => {
        db.transaction((txn) => {
            txn.executeSql(
                'select * from notes',
                [],
                (tx, results) => {
                    // console.log(results);

                    const rows = results.rows;
                    let data = [];
                    for (let i = 0; i < rows.length; i++) {
                        data.push(rows.item(i));
                    }
                    // console.log(data);

                    setData(data);
                },
                (error) => {
                    console.error('Fetch Error:', error);
                }
            );
        });


    }

    const handleDisplay = () => {
        try {
            Display(setData);

            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve([]);
                }, 500);
            });
        } catch (error) {
            alert(error.message);
        }
    };

    const Insert = (title, description, date) => {
        db.transaction((txn) => {
            txn.executeSql(
                'insert into notes(title,description,date) values(?,?,?)',
                [title, description, date],
                (tx, result) => {
                    // ToastAndroid.show("Record Inserted", ToastAndroid.SHORT);
                    console.log('Data Inserted Successfully:', result);
                },
                (error) => {
                    console.error('Insertion Error:', error);
                }
            );
        })
    }

    const handleInsert = () => {
        try {
            if (!title.trim() || !description.trim()) {
                alert('Please fill in all details');
                return;
            }

            Insert(title, description, date);
            setTitle('');
            setDescription('');
            setUpdateId(null);
            setVisible(false);
            handleDisplay();
        } catch (error) {
            alert(error.message);
        }
    }

    const Delete = (id) => {
        db.transaction((txn) => {
            txn.executeSql(
                'delete from notes where id=?',
                [id],
                (tx, result) => {
                    // ToastAndroid.show("Record Deleted", ToastAndroid.SHORT);
                    console.log('Data Deleted Successfully:', result);
                },
                (error) => {
                    console.error('Delete Error:', error);
                }
            )
        })
    }

    const handleDelete = (id) => {
        Alert.alert(
            'Confirm Delete', 'Are you sure want to delete ?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        Delete(id);
                        handleDisplay();
                    }
                }
            ],
            { cancelable: false }
        );
    };

    const Update = (id, title, description) => {
        db.transaction((txn) => {
            txn.executeSql(
                'update notes set title = ?,description = ? where id = ?',
                [title, description, id],
                (tx, result) => {
                    // ToastAndroid.show("Record Updated", ToastAndroid.SHORT);
                    console.log('Data Updated Successfully:', result);
                },
                (error) => {
                    console.error('Update Error:', error);
                }
            );
        })
    }

    const handleUpdate = () => {
        try {
            if (!title.trim() || !description.trim()) {
                alert('Please fill in all details');
                return;
            }

            Update(updateId, title, description);
            setTitle('');
            setDescription('');
            setUpdateId(null);
            setVisible(false);
            handleDisplay();
        } catch (error) {
            alert(error.message);
        }
    }

    const handleSearch = (text) => {
        db.transaction((txn) => {
            txn.executeSql(
                'select * from notes where title like ?',
                [`%${text}%`],
                (tx, results) => {
                    const rows = results.rows;
                    let filterData = [];
                    for (let i = 0; i < rows.length; i++) {
                        filterData.push(rows.item(i));
                    }
                    setData(filterData);
                },
                (error) => {
                    console.error('Search error:', error);
                }
            )
        })
    }

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => {
            setUpdateId(item.id);
            setTitle(item.title);
            setDescription(item.description);
            setDate(item.date);
            setVisible(true);
        }} activeOpacity={1} onLongPress={() => handleDelete(item.id)} style={{ backgroundColor: '#343434', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, marginBottom: 10 }}>
            <Text style={{ fontSize: 20, color: '#f9f9f9', fontWeight: '500', marginBottom: 5 }}>{item.title}</Text>
            <Text numberOfLines={1} style={{ fontSize: 13, color: '#f6f6f6', marginBottom: 3 }}>{item.description.split('\n')[0]}</Text>
            <Text style={{ fontSize: 13, color: '#f6f6f6' }}>{item.date}</Text>
        </TouchableOpacity>
    )

    return (
        <View style={{ flex: 1, backgroundColor: 'black', padding: 10 }}>
            {isSearching ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 24.5, paddingHorizontal: 10, marginBottom: 20, }}>
                    <TextInput
                        value={searchQuery}
                        onChangeText={(text) => {
                            setSearchQuery(text);
                            handleSearch(text);  // function defined below
                        }}
                        placeholder="Search by title"
                        placeholderTextColor="#999"
                        style={{
                            flex: 1,
                            // borderBottomWidth: 1,
                            // borderBottomColor: 'white',
                            color: 'white',
                            fontSize: 18,
                            padding: 0,
                        }}
                        autoFocus
                    />
                    <TouchableOpacity onPress={() => {
                        setIsSearching(false);
                        setSearchQuery('');
                        handleDisplay();
                    }}>
                        <Icon name="close" color="white" size={25} style={{ marginLeft: 10 }} />
                    </TouchableOpacity>
                </View>
            )
                :
                (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, marginBottom: 20, }}>
                        <Text style={{ fontSize: 42, color: 'white', }}>Notes</Text>
                        <TouchableOpacity onPress={() => data.length !== 0 ? setIsSearching(true) : ToastAndroid.show('Not found any notes for search', ToastAndroid.SHORT)} style={{}}><Icon name='search' color={'white'} size={25}></Icon></TouchableOpacity>
                    </View>
                )
            }
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: '30%' }}>
                    <ActivityIndicator size="large" color="white" />
                </View>
            ) : data.length > 0 ? (
                <FlatList
                    showsVerticalScrollIndicator={false}
                    data={data}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                />
            ) : hasFetchedOnce ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <LottieView
                        source={require('./src/assets/notfound.json')}
                        autoPlay
                        loop
                        style={{ height: 250, width: 250 }}
                    />
                    <Text style={{ color: 'white', marginTop: 5, marginBottom: 80, fontSize: 15 }}>
                        No Notes Found
                    </Text>
                </View>
            ) : null}
            {!isSearching &&
                <TouchableOpacity onPress={() => { setUpdateId(null); setTitle(''); setDescription(''); setVisible(true) }} style={{ position: 'absolute', backgroundColor: '#94aae4', padding: 0, borderRadius: 35, alignItems: 'center', width: 70, height: 'auto', aspectRatio: 1, justifyContent: 'center', bottom: 32, right: 32 }}><Text style={{ color: 'white', fontSize: 40 }}>+</Text></TouchableOpacity>
            }
            <Modal
                visible={visible}
                animationType="slide"
                onRequestClose={() => setVisible(false)}>
                <View style={{ flex: 1, backgroundColor: 'black', padding: 20 }}>
                    <View style={{ flexDirection: 'row', marginBottom: 20, justifyContent: 'space-between', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => setVisible(false)}><Icon name='angle-left' color={'white'} size={23}></Icon></TouchableOpacity>
                        <TouchableOpacity onPress={updateId ? handleUpdate : handleInsert}><Icon1 name='check' color={(title.trim() && description.trim()) ? 'white' : 'gray'} size={32}></Icon1></TouchableOpacity>
                    </View>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Title"
                        placeholderTextColor={'#5d5e63'}
                        style={{ color: 'white', fontWeight: 'bold', fontSize: 25, marginBottom: 0 }}></TextInput>
                    <Text style={{ color: '#777777', marginStart: 5, marginBottom: 10 }}>{date}</Text>
                    <TextInput autoFocus value={description} onChangeText={setDescription} multiline style={{ fontSize: 15, marginStart: 3 }}></TextInput>
                </View>
            </Modal>
        </View>
    )
}

export default NotesApp;