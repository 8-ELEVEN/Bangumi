/*
 * @Author: czy0729
 * @Date: 2019-07-13 18:59:53
 * @Last Modified by: czy0729
 * @Last Modified time: 2025-09-08 22:24:59
 */
import {
  cData,
  cFind,
  cheerio,
  cHtml,
  cMap,
  cText,
  getCoverSmall,
  HTMLDecode,
  htmlMatch,
  HTMLToTree,
  HTMLTrim,
  matchAvatar,
  matchUserId,
  safeObject,
  trim
} from '@utils'
import { fetchHTML } from '@utils/fetch'
import decoder from '@utils/thirdParty/html-entities-decoder'
import { HTML_RAKUEN } from '@constants'
import { RakuenScope, RakuenType, RakuenTypeGroup, RakuenTypeMono } from '@types'
import { INIT_BLOG, INIT_COMMENTS_ITEM, INIT_TOPIC, STATE } from './init'
import { getBlogItemTime, getBlogTime } from './utils'
import {
  BlockedUsersItem,
  BoardItem,
  CommentsItem,
  CommentsItemWithSub,
  Likes,
  NotifyItem,
  ReviewsItem,
  Topic
} from './types'

export async function fetchRakuen(args: {
  scope: RakuenScope
  type: RakuenType | RakuenTypeMono | RakuenTypeGroup
}) {
  const { scope, type } = args || {}

  // -------------------- 请求HTML --------------------
  const res = fetchHTML({
    url: HTML_RAKUEN(scope, type)
  })
  const raw = await res
  const HTML = HTMLTrim(raw).match(/<div id="eden_tpc_list"><ul>(.+?)<\/ul><\/div>/)

  // -------------------- 分析HTML --------------------
  const rakuen = []
  if (HTML) {
    const tree = HTMLToTree(HTML[1])
    tree.children.forEach(item => {
      const avatar = item.children[0].children[0].attrs.style.replace(
        /background-image:url\('|'\)/g,
        ''
      )
      const userId = item.children[0].children[0].attrs?.['data-user']

      const { children } = item.children[1]
      const title = children[0].text[0]
      const { href = '' } = children[0].attrs
      const replies = children[1].text[0]

      // 小组有可能是没有的
      let group = ''
      let groupHref = ''
      let time = ''
      if (children.length === 3) {
        time = children[2].children[0].text[0]
      } else {
        group = children[3].text[0]
        groupHref = children[3].attrs.href
        time = children[4] ? children[4].text[0] : children[3].text[0]
      }

      const data = {
        title: HTMLDecode(title),
        avatar,
        userId,
        userName: HTMLDecode(item.children[0].attrs.title),
        href,
        replies,
        group: HTMLDecode(group),
        groupHref,
        time
      }
      rakuen.push(data)
    })
  }

  return rakuen
}

/** 留言层信息 */
export function cheerioComments(html: string, reverse?: boolean) {
  if (!html) return []

  try {
    const list =
      cheerio(htmlMatch(html, '<div id="comment_list"', '<div id="footer">'))(
        '.commentList .row_replyclearit'
      )
        .map((_index: number, element: any) => {
          const $row = cheerio(element)
          const info = cText($row.find('div.action small').eq(0)).split(' - ')
          const $name = $row.find('a.l').eq(0)
          return {
            id: cData($row, 'id').replace('post_', ''),
            time: info?.[1] || '',
            floor: info?.[0] || '',
            avatar: matchAvatar(cData($row.find('span.avatarNeue'), 'style')),
            userId: matchUserId(cData($name, 'href')),
            userName: cText($name),
            userSign: cText($row.find('span.sign')),
            replySub: cData($row.find('a.icon[onclick]'), 'onclick'),
            message: decoder(cHtml($row.find('.reply_content > .message'))),
            sub:
              $row
                .find('.sub_reply_bgclearit')
                .map((_index: number, element: any) => {
                  const $row = cheerio(element)
                  const info = cText($row.find('div.action small')).split(' - ')
                  const $name = $row.find('a.l')
                  return {
                    id: cData($row, 'id').replace('post_', ''),
                    time: info?.[1] || '',
                    floor: info?.[0] || '',
                    avatar: matchAvatar(cData($row.find('span.avatarNeue'), 'style')),
                    userId: matchUserId(cData($name, 'href')),
                    userName: cText($name),
                    userSign: '',
                    replySub: cData($row.find('a.icon[onclick]'), 'onclick'),
                    message: decoder(cHtml($row.find('.cmt_sub_content')))
                  }
                })
                .get() || []
          }
        })
        .get() || []

    return reverse ? list.reverse() : list
  } catch (error) {
    return []
  }
}

/** 小组信息 */
export function cheerioGroupInfo(html: string) {
  const $ = cheerio(htmlMatch(html, '<div id="columnA"', '<h2 class="title">'))

  const url = $('#groupJoinAction > a.chiiBtn').attr('href') || ''
  let joinUrl: string
  let byeUrl: string
  if (url.includes('/join?')) {
    joinUrl = url
  } else if (url.includes('/bye?')) {
    byeUrl = url
  }

  return safeObject({
    title: $('.SecondaryNavTitle').text().trim(),
    cover: $('.port.ll').attr('src'),
    content: $('.line_detail .tip')
      .text()
      .replace(/\r\n\r\n|\r\n\r\n\r\n/g, '\r\n'),
    create: $('div.grp_box > span.tip').text().trim(),
    joinUrl,
    byeUrl
  })
}

/** 小组帖子列表 */
export function cheerioGroup(html: string) {
  return cheerio(htmlMatch(html, '<div id="columnA"', '<div id="footer">'))('tr.topic')
    .map((_index: number, element: any) => {
      const $tr = cheerio(element)
      const $title = $tr.find('.subject > a')
      const $user = $tr.find('.author > a')
      const $tip = $tr.find('a.tip_j')
      return {
        href: $title.attr('href') || '',
        title: $title.attr('title'),
        userId: ($user.attr('href') || '').replace('/user/', ''),
        userName: HTMLDecode($user.text().trim()),
        replies: $tr.find('.posts').text().trim(),
        time: $tr.find('.time').text().trim(),
        tip: $tip.text().trim(),
        tipHref: $tip.attr('href') || ''
      }
    })
    .get()
}

/** 电波提醒列表 */
export function cheerioNotify(html: string) {
  const $ = cheerio(htmlMatch(html, '<div id="comment_list"', '<div id="footer">'))

  return cMap($('div.tml_item'), $row => {
    const $name = $row.find('a.l')
    const $title = $row.find('a.nt_link')
    const title = cText($title)
    let message: string
    let message2: string

    if (title) {
      ;[message, message2] = cText($row.find('div.reply_content')).split(title)
    } else {
      message = cText($row.find('div.reply_content'))
    }

    return {
      avatar: matchAvatar(cData($row.find('span.avatarNeue'), 'style')) || '',
      userName: cText($name),
      userId: matchUserId(cData($name, 'href')) || '',
      title,
      href: cData($title, 'href') || '',
      message,
      message2
    } as NotifyItem
  })
}

/** 帖子和留言 */
export function cheerioTopic(html: string) {
  let topic: Topic = INIT_TOPIC
  let comments: CommentsItem[] = []
  let likes: Likes = {}

  try {
    const $ = cheerio(htmlMatch(html, '<div id="subject_info">', '</body>'))

    // 主楼
    const $group = $('#pageHeader a.avatar')
    const $user = $('div.postTopic strong > a.l')
    const [floor, time] = ($('div.postTopic div.re_info small').text().trim() || '')
      .split('/')[0]
      .split(' - ')
    const titleText = $('#pageHeader > h1').text().trim() || ''

    let title: string
    if (titleText.includes(' &raquo; ')) {
      title = String(titleText.split(' &raquo; ')[1]).replace(/讨论|章节/, '')
    } else {
      title = titleText.split(' / ')?.[1] || $group.attr('title') || ''
    }

    topic = safeObject<Topic>({
      id: String($('div.postTopic').attr('id') || '').substring(5),
      avatar: getCoverSmall(matchAvatar($('div.postTopic span.avatarNeue').attr('style'))),
      floor,
      formhash: $('input[name=formhash]').attr('value') || '',
      likeType: $('a.like_dropdown').data('like-type') || '',
      group: $group.text().trim().replace(/\n/g, '') || $group.attr('title') || '',
      groupHref: $group.attr('href') || '',
      groupThumb: getCoverSmall($('a.avatar > img.avatar').attr('src')) || '',
      lastview: '',
      message: HTMLTrim($('div.topic_content').html()),
      time,
      title,
      userId: matchUserId($user.attr('href')),
      userName: $user.text().trim(),
      userSign: HTMLDecode($('div.postTopic span.tip_j').text().trim()),
      tip: $('#reply_wrapper span.tip.rr').text().trim(),
      close: $('div.row_state span.tip_j').text().trim(),
      delete: html.includes(
        '<p class="text">数据库中没有查询到指定话题，话题可能正在审核或已被删除。</p>'
      )
    })

    // 回复
    comments =
      $('#comment_list > div.row_reply')
        .map((_index: number, element: any) => {
          /** 回复主楼层块 */
          const $row = cheerio(element)

          /** 左上角头像块 */
          const $avatar = $row.find('> a.avatar')

          /** 左上角用户信息块 */
          const $user = $row.find('> div.inner > span.userInfo')

          /** 右上角楼层时间块 */
          const $info = $row.find('> div.re_info')

          /** 主楼层内容块 */
          const $floor = $row.find('> div.inner > div.reply_content')

          const [floor, time] = $info.find('small').text().trim().split(' - ')

          return safeObject<CommentsItemWithSub>({
            id: $row.attr('id').substring(5),
            avatar: getCoverSmall(matchAvatar($avatar.find('span.avatarNeue').attr('style'))),
            floor,
            message: decoder(HTMLTrim($floor.find('> div.message').html())),
            replySub: $info.find('> div.action a.icon').attr('onclick'),
            time,
            userId: matchUserId($avatar.attr('href')),
            userName:
              $user.find('strong > a.l').text().trim() ||
              $row.find('> div.inner > strong > a.l').text().trim(),
            userSign: HTMLDecode($user.find('span.tip_j').text().trim()),
            erase: $info.find('a.erase_post').attr('href'),

            // 子回复
            sub:
              $row
                .find('div.sub_reply_bg')
                .map((_index: number, element: any) => {
                  const $row = cheerio(element)
                  const [floor, time] = ($row.find('small').text().trim() || '').split(' - ')
                  return safeObject<CommentsItem>({
                    avatar: getCoverSmall(matchAvatar($row.find('span.avatarNeue').attr('style'))),
                    floor,
                    id: $row.attr('id').substring(5),
                    message: decoder(HTMLTrim($row.find('div.cmt_sub_content').html())),
                    replySub: $row.find('a.icon').attr('onclick'),
                    time: trim(time),
                    userId: matchUserId($row.find('a.avatar').attr('href')),
                    userName: $row.find('strong > a.l').text().trim(),
                    userSign: HTMLDecode($row.find('span.tip_j').text().trim()),
                    erase: $row.find('a.erase_post').attr('href')
                  })
                })
                .get() || []
          })
        })
        .get() || []

    try {
      likes = JSON.parse(html.match(/data_likes_list\s*=\s*(\{.*?\});/)?.[1])
    } catch (error) {}
  } catch (ex) {
    console.log(ex)
  }

  return {
    topic,
    comments,
    likes
  }
}

/** 日志和留言 */
export function cheerioBlog(html: string) {
  let blog: any = INIT_BLOG
  let blogComments = []

  try {
    const $ = cheerio(htmlMatch(html, '<div id="columnA', '<div id="footer'))
    const $user = $('#viewEntry .author .title a.l')

    blog = {
      avatar: cData($('#viewEntry .author img'), 'src'),
      floor: '#0',
      formhash: cData(cFind($, 'input[name=formhash]'), 'value'),
      message: cHtml($('#entry_content')),
      time: getBlogTime(cText($('.header .time'))),
      title: cText($('#viewEntry h1.title')),
      userId: cData($user, 'href').replace('/user/', ''),
      userName: cText($user),
      userSign: '',
      related: cMap($('.entry-related-subjects .subject-card'), $row => ({
        id: cData(cFind($row, '.title a'), 'href').replace('/subject/', ''),
        name: cText(cFind($row, '.info')) || cText(cFind($row, '.title a')),
        image: cData(cFind($row, 'img'), 'src')
      }))
    }

    // 回复
    blogComments =
      $('#comment_list > div.row_reply')
        .map((_index: number, element: any) => {
          const $row = cheerio(element)
          const [floor, time] = ($row.find('> div.re_info small').text().trim() || '').split(' - ')
          return safeObject({
            ...INIT_COMMENTS_ITEM,
            avatar: getCoverSmall(matchAvatar($row.find('span.avatarNeue').attr('style'))),
            floor,
            id: $row.attr('id').substring(5),
            message: HTMLTrim($row.find('> div.inner > div.reply_content > div.message').html()),
            replySub: $row.find('> div.re_info > div.action a.icon').attr('onclick'),
            time,
            userId: matchUserId($row.find('a.avatar').attr('href')),
            userName:
              $row.find('> div.inner > span.userInfo > strong > a.l').text() ||
              $row.find('> div.inner > strong > a.l').text(),
            userSign: HTMLDecode($row.find('span.tip_j').text()),
            erase: $row.find('> div.re_info a.erase_post').attr('href'),

            // 子回复
            sub:
              $row
                .find('div.sub_reply_bg')
                .map((_index: number, element: any) => {
                  const $row = cheerio(element, {
                    decodeEntities: false
                  })
                  const [floor, time] = ($row.find('small').text() || '').split(' - ')
                  return safeObject({
                    ...INIT_COMMENTS_ITEM,
                    avatar: getCoverSmall(matchAvatar($row.find('span.avatarNeue').attr('style'))),
                    floor,
                    id: $row.attr('id').substring(5),
                    message: HTMLTrim($row.find('div.cmt_sub_content').html()),
                    replySub: $row.find('a.icon').attr('onclick'),
                    time: trim(time),
                    userId: matchUserId($row.find('a.avatar').attr('href')),
                    userName: $row.find('strong > a.l').text(),
                    userSign: HTMLDecode($row.find('span.tip_j').text()),
                    erase: $row.find('a.erase_post').attr('href')
                  })
                })
                .get() || []
          })
        })
        .get() || []
  } catch (ex) {}

  return {
    blog,
    blogComments
  }
}

/** 我的小组 */
export function cheerioMine(html: string) {
  const $ = cheerio(html)
  return {
    list:
      $('ul.browserMedium > li.user')
        .map((_index: number, element: any) => {
          const $li = cheerio(element)
          const $a = $li.find('a.avatar')
          return safeObject({
            id: String($a.attr('href')).replace('/group/', ''),
            cover: $li.find('img.avatar').attr('src').split('?')[0],
            name: $a.text().trim(),
            num: $li.find('small.feed').text().trim().replace(' 位成员', '')
          })
        })
        .get() || []
  }
}

/** 条目讨论版 */
export function cheerioBoard(html: string) {
  const $ = cheerio(htmlMatch(html, '<div id="columnInSubjectA', '<div id="columnInSubjectB'))
  return cMap($('.topic_list tr'), $row => {
    const $title = cFind($row, '.subject > a')
    const $user = cFind(cFind($row, 'td', 1), 'a')
    return {
      href: cData($title, 'href'),
      title: cData($title, 'title'),
      userId: cData($user, 'href').replace('/user/', ''),
      userName: HTMLDecode(cText($user)),
      replies: cText(cFind($row, 'td', 2)),
      time: cText(cFind($row, 'td', 3))
    } as BoardItem
  })
}

/** 条目影评 */
export function cheerioReviews(html: string) {
  const $ = cheerio(htmlMatch(html, '<div id="columnInSubjectA', '<div id="columnInSubjectB'))
  return cMap($('#entry_list .item'), $row => {
    const $a = cFind($row, 'h2.title a')
    const $user = cFind($row, '.time a.l')

    let replies = cText(cFind($row, '.time a.l', 1))
    if (replies === '0 回复') replies = ''

    return {
      id: cData($a, 'href').replace('/blog/', ''),
      title: cText($a),
      avatar: cData(cFind($row, 'a.avatar img'), 'src'),
      userId: cData($user, 'href').replace('/user/', ''),
      userName: cText($user),
      replies,
      time: getBlogItemTime(cText(cFind($row, '.time'), true)),
      content: cText(cFind($row, '.content')).replace(/\r\n/g, ' ')
    } as ReviewsItem
  })
}

/** 超展开热门 */
export function cheerioHot(html: string) {
  return (
    cheerio(html)('.sideTpcList li')
      .map((_index: number, element: any) => {
        const $tr = cheerio(element)
        const $avatar = $tr.find('img')
        const $title = $tr.find('a.l')
        const $topic = $tr.find('a.tip')
        const $subject = $tr.find('p > small.grey > a')
        return {
          title: HTMLDecode($title.text().trim()),
          avatar: $avatar.attr('src') || '',
          userName: HTMLDecode($avatar.attr('title') || ''),
          href: $title.attr('href') || '',
          replies: $tr.find('.inner > small.grey').text().trim(),
          group: HTMLDecode($topic.text().trim() || $subject.text().trim()),
          groupHref: $topic.attr('href') || $subject.attr('href') || '',
          time: ''
        }
      })
      .get() || []
  ).filter((item: { group: any }) => !!item.group)
}

/** 帖子楼层编辑, 返回字符串代表能正常回复, 返回 true 代表已被回复不允许修改 */
export function cheerioTopicEdit(html: string): string | boolean {
  const text = cheerio(htmlMatch(html, '<form id="ModifyReplyForm"', '<div id="columnInSubjectB"'))(
    '#content'
  )
    .text()
    .trim()
  if (text) return text

  return html.includes('你只能修改自己发表的帖子')
}

/** 个人设置隐私 */
export function cheerioPrivacy(html: string) {
  const $ = cheerio(htmlMatch(html, '<div id="columnA"', '<div id="columnB"'))

  const blockedUsers: BlockedUsersItem[] = []
  $('tr').each((_index: number, element: any) => {
    const $row = cheerio(element)
    const $user = $row.find('td[valign="top"] a')
    const userId = ($user.attr('href') || '').split('/user/')?.[1]
    if (userId) {
      blockedUsers.push({
        userId,
        userName: $user.text().trim(),
        href: HTMLDecode($row.find('a.tip_i').attr('href') || '')
      })
    }
  })

  const privacy: typeof STATE.privacy = {
    'privacy_set[1]': $('select[name="privacy_set[1]"]').val() || '0',
    'privacy_set[30]': $('select[name="privacy_set[30]"]').val() || '0',
    'privacy_set[20]': $('select[name="privacy_set[20]"]').val() || '0',
    'privacy_set[21]': $('select[name="privacy_set[21]"]').val() || '0'
  }

  return {
    blockedUsers,
    privacy,
    formhash: $('input[name="formhash"]').val() || ''
  }
}
