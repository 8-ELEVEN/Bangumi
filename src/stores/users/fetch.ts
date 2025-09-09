/*
 * @Author: czy0729
 * @Date: 2023-04-25 14:03:45
 * @Last Modified by: czy0729
 * @Last Modified time: 2025-09-09 20:58:22
 */
import { getTimestamp } from '@utils'
import { fetchHTML } from '@utils/fetch'
import {
  HTML_FRIENDS,
  HTML_USERS,
  HTML_USERS_BLOGS,
  HTML_USERS_CATALOGS,
  HTML_USERS_CHARCTER,
  HTML_USERS_MONO_RECENTS,
  HTML_USERS_PERSON,
  HTML_USERS_WIKI
} from '@constants'
import { UserId } from '@types'
import userStore from '../user'
import {
  cheerioBlogs,
  cheerioCatalogs,
  cheerioCharacters,
  cheerioFriends,
  cheerioRecents,
  cheerioUsers
} from './common'
import Computed from './computed'
import { FetchCatalogsArgs, Friend } from './types'

export default class Fetch extends Computed {
  /** 好友列表 */
  fetchFriends = async (args?: { userId?: UserId }) => {
    const { userId = userStore.myId } = args || {}
    const html = await fetchHTML({
      url: `!${HTML_FRIENDS(userId)}`
    })
    const friends = cheerioFriends(html)

    // - 20201124 缓存好友上一次历史名字
    friends.forEach((item: Friend) => {
      const lastItem = this.friendsMap[item.userId]
      const lastUserName = lastItem?.lastUserName
      if (lastUserName && lastUserName === item.userName) return

      item.lastUserName = lastItem?.userName || item.userName
    })

    const key = 'friends'
    this.setState({
      [key]: {
        [userId]: {
          list: friends || [],
          _loaded: getTimestamp()
        }
      }
    })
    this.save(key)

    // 自己要生成 userId 哈希映射
    if (userId === userStore.myId) {
      const myFriendsMap = {
        _loaded: getTimestamp()
      }
      friends.forEach((item: Friend) => (myFriendsMap[item.userId] = true))

      const key = 'myFriendsMap'
      this.setState({
        [key]: myFriendsMap
      })
      this.save(key)
    }

    return friends
  }

  /** 用户信息 (他人视角) */
  fetchUsers = async (args?: { userId?: UserId }) => {
    const { userId = userStore.myId } = args || {}
    const html = await fetchHTML({
      url: HTML_USERS(userId)
    })

    const users = cheerioUsers(html)
    const data = {
      ...users,
      _loaded: getTimestamp()
    }

    const key = 'users'
    this.setState({
      [key]: {
        [userId]: data
      }
    })
    this.save(key)

    return data
  }

  /** 用户收藏的虚拟角色 */
  fetchCharacters = async (userId: UserId = userStore.myId, refresh?: boolean) => {
    const STATE_KEY = 'characters'
    const ITEM_KEY = userId
    const LIMIT = 44

    try {
      const { list, pagination } = this[STATE_KEY](ITEM_KEY)
      const page = refresh ? 1 : pagination.page + 1
      const html = await fetchHTML({
        url: HTML_USERS_CHARCTER(userId, page)
      })

      const next = cheerioCharacters(html)
      this.setState({
        [STATE_KEY]: {
          [ITEM_KEY]: {
            list: refresh ? next : [...list, ...next],
            pagination: {
              page,
              pageTotal: next.length >= LIMIT ? 100 : page
            },
            _loaded: getTimestamp()
          }
        }
      })
      this.save(STATE_KEY)
    } catch (error) {
      this.error('fetchCharacters', error)
    }

    return this[STATE_KEY](ITEM_KEY)
  }

  /** 用户收藏的现实人物 */
  fetchPersons = async (userId: UserId = userStore.myId, refresh?: boolean) => {
    const STATE_KEY = 'persons'
    const ITEM_KEY = userId
    const LIMIT = 44

    try {
      const { list, pagination } = this[STATE_KEY](ITEM_KEY)
      const page = refresh ? 1 : pagination.page + 1
      const html = await fetchHTML({
        url: HTML_USERS_PERSON(userId, page)
      })

      const next = cheerioCharacters(html)
      this.setState({
        [STATE_KEY]: {
          [ITEM_KEY]: {
            list: refresh ? next : [...list, ...next],
            pagination: {
              page,
              pageTotal: next.length >= LIMIT ? 100 : page
            },
            _loaded: getTimestamp()
          }
        }
      })
      this.save(STATE_KEY)
    } catch (error) {
      this.error('fetchPersons', error)
    }

    return this[STATE_KEY](ITEM_KEY)
  }

  /** 我收藏人物的最近作品 */
  fetchRecents = async (refresh?: boolean) => {
    const STATE_KEY = 'recents'
    const LIMIT = 20

    try {
      const { list, pagination } = this.recents
      const page = refresh ? 1 : pagination.page + 1
      const html = await fetchHTML({
        url: HTML_USERS_MONO_RECENTS(page)
      })

      const next = cheerioRecents(html)
      this.setState({
        [STATE_KEY]: {
          list: refresh ? next : [...list, ...next],
          pagination: {
            page,
            pageTotal: next.length >= LIMIT ? 100 : page
          },
          _loaded: getTimestamp()
        }
      })
      this.save(STATE_KEY)
    } catch (error) {
      this.error('fetchRecents', error)
    }

    return this[STATE_KEY]
  }

  /** 用户日志 */
  fetchBlogs = async (args?: { userId?: UserId }, refresh?: boolean) => {
    const { userId = userStore.myId } = args || {}
    const key = 'blogs'
    const limit = 10
    const { list, pagination } = this[key](userId)
    const page = refresh ? 1 : pagination.page + 1

    const html = await fetchHTML({
      url: HTML_USERS_BLOGS(userId, page)
    })
    const _list = cheerioBlogs(html)
    this.setState({
      [key]: {
        [userId]: {
          list: refresh ? _list : [...list, ..._list],
          pagination: {
            page,
            pageTotal: _list.length === limit ? 100 : page
          },
          _loaded: getTimestamp()
        }
      }
    })
    this.save(key)

    return this[key](userId)
  }

  /** 用户目录 */
  fetchCatalogs = async (args?: FetchCatalogsArgs, refresh?: boolean) => {
    const { userId = userStore.myId, isCollect } = args || {}

    const STATE_KEY = 'catalogs'
    const ITEM_ARGS = [userId, isCollect] as const
    const ITEM_KEY = userId
    const LIMIT = 30

    try {
      const { list, pagination } = this[STATE_KEY](...ITEM_ARGS)
      const page = refresh ? 1 : pagination.page + 1
      const html = await fetchHTML({
        url: HTML_USERS_CATALOGS(userId, page, isCollect)
      })

      const FINAL_STATE_KEY = `catalogs${isCollect ? 'Collect' : ''}` as const
      const next = cheerioCatalogs(html)
      this.setState({
        [FINAL_STATE_KEY]: {
          [ITEM_KEY]: {
            list: refresh ? next : [...list, ...next],
            pagination: {
              page,
              pageTotal: next.length >= LIMIT ? 100 : page
            },
            _loaded: getTimestamp()
          }
        }
      })
      this.save(FINAL_STATE_KEY)
    } catch (error) {
      this.error('fetchCatalogs', error)
    }

    return this[STATE_KEY](...ITEM_ARGS)
  }

  /** 查询是否存在用户 */
  checkUserExist = async (userId: UserId) => {
    const html = await fetchHTML({
      // 因为这个页面大部分用户都没有数据会比较小, 所以选取这个页面判断
      url: HTML_USERS_WIKI(String(userId).trim().toLocaleLowerCase())
    })
    return !html.includes('数据库中没有查询到该用户的信息')
  }
}
