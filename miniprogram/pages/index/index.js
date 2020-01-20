const back = wx.getBackgroundAudioManager()
let timer = null
let slideTime = null
let currentTime = ''
Page({
  /**
   * 页面的初始数据
   */
  data: {
    currentTime: '00:00',
    endTime: '00:00',
    currentProgress: null,
    long: null,
    playing: true,
    index: 0,
    hideList: true,
    move: '',
    imgRotate: '',
    playing: true,
    oneCircle: false,
    openid: '',
    myLove: false,
    currentType: '网红BGM',
    noLove: false,
    typeList: [{
        title: '网红BGM',
        type: 'hotList',
        selected: true
      },
      {
        title: '我的喜欢',
        type: 'myLoveList',
        selected: false
      },
      {
        title: '经典BGM',
        type: 'classicsList',
        selected: false
      }
    ],
    musicList: [],
    hotList: [],
    classicsList: [],
    myLoveList: []
  },
  //设置闹钟
  addClock() {
    let that = this
    wx.showActionSheet({
      itemList: ['10分钟', '20分钟', '30分钟', '60分钟'],
      itemColor: 'rgb(50,50,50)',
      success(res) {
        if (timer) {
          clearTimeout(timer)
        }
        let minutes = null
        switch (res.tapIndex) {
          case 0:
            minutes = 10
            break;
          case 1:
            minutes = 20
            break;
          case 2:
            minutes = 30
            break;
          case 3:
            minutes = 60
            break;
        }
        wx.showToast({
          title: '闹钟设置成功，' + minutes + '分钟之后关闭',
          icon: 'none'
        })
        timer = setTimeout(() => {
          back.pause()
          that.setData({
            playing: false
          })
        }, minutes * 60 * 1000)
      }
    })

  },
  //添加喜欢歌曲
  addLove() {
    let musicItem = this.data.musicList[this.data.index]
    if (musicItem._openid) {
      delete musicItem._openid
    }
    const db = wx.cloud.database()
    db.collection('myLoveList').add({
      data: {
        ...musicItem
      },
      success: res => {
        // 在返回结果中会包含新创建的记录的 _id
        wx.showToast({
          title: '添加喜欢成功',
        })
        this.setData({
          myLove: true
        })
        this.getLoveList()
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '喜欢失败'
        })
        console.error('[数据库] [新增记录] 失败：', err)
      }
    })
  },
  //取消喜欢歌曲
  cancelLove() {
    let musicItem = this.data.musicList[this.data.index]
    const db = wx.cloud.database()
    db.collection('myLoveList').doc(musicItem._id).remove({
      success: res => {
        wx.showToast({
          title: '取消喜欢成功',
        })
        this.setData({
          myLove: false
        })
        this.getLoveList()
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '取消喜欢失败'
        })
        console.error('[数据库] [取消记录] 失败：', err)
      }
    })
  },
  //切换循环类型
  changeCircle() {
    this.setData({
      oneCircle: !this.data.oneCircle
    })
    if (this.data.oneCircle) {
      wx.showToast({
        title: '单曲循环',
        icon: 'none'
      })
    } else {
      wx.showToast({
        title: '列表循环',
        icon: 'none'
      })
    }
  },
  //选择播放的歌曲
  selectMusic(e) {
    this.setData({
      index: e.currentTarget.dataset.index,
      playing: true
    })
    back.title = this.data.musicList[this.data.index].name
    back.src = this.data.musicList[this.data.index].src
    this.judge()
  },
  //判断当前歌曲是否是喜欢的
  judge() {
    let currentId = this.data.musicList[this.data.index]._id;
    let bool = this.data.myLoveList.every(item => {
      return currentId !== item._id
    })
    if (bool) {
      this.setData({
        myLove: false
      })
    } else {
      this.setData({
        myLove: true
      })
    }
  },
  //播放暂停切换
  toggle(e) {
    if (this.data.playing) {
      back.pause()
      this.setData({
        playing: false
      })
    } else {
      back.play()
      this.setData({
        playing: true
      })
    }
  },
  //上一首
  prev() {
    this.setData({
      index: --this.data.index,
      playing: true,
      imgRotate: 'rotateLeft'
    })
    if (this.data.index < 0) {
      this.setData({
        index: this.data.musicList.length - 1
      })
    }
    back.title = this.data.musicList[this.data.index].name
    back.src = this.data.musicList[this.data.index].src
    setTimeout(() => {
      this.setData({
        imgRotate: ''
      })
    }, 1000)
  },
  //下一首
  next() {
    this.setData({
      index: ++this.data.index,
      imgRotate: 'rotateRight',
      playing: true
    })
    if (this.data.index >= this.data.musicList.length) {
      this.setData({
        index: 0
      })
    }
    back.title = this.data.musicList[this.data.index].name
    back.src = this.data.musicList[this.data.index].src
    this.judge()
    setTimeout(() => {
      this.setData({
        imgRotate: ''
      })
    }, 1000)
  },
  list() {
    this.data.typeList.forEach(item => {
      if (item.selected === true) {
        this.setData({
          hideList: false,
          move: 'bottomOpen'
        })
      }
    })
  },
  //关闭歌曲选择页面
  close() {
    this.data.typeList.forEach(item => {
      if (item.selected === true) {
        this.setData({
          move: 'bottomClose'
        })
      }
    })
    setTimeout(() => {
      this.setData({
        hideList: true
      })
    }, 300)
  },
  //选择BGM类型
  selectType(e) {
    let typeList = this.data.typeList
    typeList.forEach(item => {
      if (e.currentTarget.dataset.title === item.title) {
        if (item.selected !== true) {
          item.selected = true
          if (item.type === 'myLoveList') {
            if (this.data.myLoveList.length === 0) {
              this.setData({
                noLove: true
              })
              this.displayTip()
              return
            }
            this.setData({
              myLove: true,
            })
          } else {
            this.getLoveList()
            this.setData({
              myLove: false,
              noLove: false
            })
          }
          this.setData({
            playing: true,
            index: 0,
            currentType: item.title,
            musicList: this.data[item.type]
          })
          back.title = this.data.musicList[this.data.index].name
          back.src = this.data.musicList[this.data.index].src
          this.judge()
        } else {
          if (this.data.myLoveList.length === 0 && item.type === 'myLoveList') {
            this.setData({
              noLove: true
            })
            this.displayTip()
            return
          }
        }
        this.setData({
          hideList: false,
          move: 'bottomOpen'
        })
      } else {
        item.selected = false
      }
    })
    this.setData({
      typeList: typeList
    })
  },
  //提示添加喜欢歌曲
  displayTip() {
    wx.showToast({
      title: '暂无喜欢音乐，去其他列表点击爱心添加吧',
      icon: 'none'
    })
  },
  //获取歌曲列表并播放
  getList() {
    let that = this
    const db = wx.cloud.database()
    let p1 = db.collection('hotList').get()
    let p3 = db.collection('classicsList').get()
    let p2 = db.collection('myLoveList').where({
      _openid: this.data.openid
    }).get()
    let p = Promise.all([p1, p2, p3])
    p.then(res => {
      wx.hideLoading()
      this.sortMusic(res[0].data)
      this.sortMusic(res[1].data)
      this.sortMusic(res[2].data)
      this.setData({
        musicList: res[0].data,
        hotList: res[0].data,
        myLoveList: res[1].data,
        classicsList: res[2].data
      })
      back.title = that.data.musicList[that.data.index].name
      back.src = that.data.musicList[that.data.index].src
      that.timeUpdate()
      this.judge()
    })
  },
  //歌曲排序
  sortMusic(list) {
    list.sort((a, b) => {
      if (a.sort > b.sort) {
        return -1
      } else {
        return 1
      }
    })
  },
  //获取我的喜欢歌曲列表
  getLoveList() {
    const db = wx.cloud.database()
    db.collection('myLoveList').where({
      _openid: this.data.openid
    }).get({
      success: res => {
        this.sortMusic(res.data)
        this.setData({
          myLoveList: res.data
        })
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '获取歌曲列表失败'
        })
      }
    })
  },


  //监听当前歌曲进度
  timeUpdate() {
    back.onTimeUpdate(() => {
      let long = back.duration
      let current = back.currentTime
      let endTime = formatTime(long)
      let currentTime = formatTime(current)
      this.setData({
        currentTime: currentTime,
        endTime: endTime,
        currentProgress: (current / long) * 100,
        long: long
      })
      back.onPlay(() => {
        this.setData({
          playing: true
        })
      })
      back.onPause(() => {
        this.setData({
          playing: false
        })
      })
      back.onNext(() => {
        this.next()
      })
      back.onPrev(() => {
        this.prev()
      })
      if (this.data.oneCircle) {
        back.onEnded(() => {
          back.title = this.data.musicList[this.data.index].name
          back.src = this.data.musicList[this.data.index].src
        })
      } else {
        back.onEnded(() => {
          this.setData({
            index: ++this.data.index
          })
          if (this.data.index >= this.data.musicList.length) {
            this.setData({
              index: 0
            })
          }
          back.title = this.data.musicList[this.data.index].name
          back.src = this.data.musicList[this.data.index].src
        })
      }

    })

    function formatTime(num) {
      let munites = parseInt(num / 60)
      if (munites < 10) {
        munites = '0' + munites
      }
      let seconds = parseInt(num % 60)
      if (seconds < 10) {
        seconds = '0' + seconds
      }
      return munites + ":" + seconds
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.showLoading({
      title: '加载中...'
    })
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        this.setData({
          openid: res.result.openid
        })
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
      }
    })
    this.getList()

  },
  //拖动进度条的过程中
  sliderChange(e) {
    slideTime = (e.detail.value / 100) * this.data.long
    currentTime = formatTime(slideTime)
    back.seek(slideTime)
    back.play()
    console.log(currentTime)
    this.setData({
      currentTime: currentTime,
      playing: true
    })
    function formatTime(num) {
      let munites = parseInt(num / 60)
      if (munites < 10) {
        munites = '0' + munites
      }
      let seconds = parseInt(num % 60)
      if (seconds < 10) {
        seconds = '0' + seconds
      }
      return munites + ":" + seconds
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**get.dataset.title
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})