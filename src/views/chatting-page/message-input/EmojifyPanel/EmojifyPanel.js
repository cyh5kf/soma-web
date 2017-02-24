import React, {PropTypes} from 'react';
import {classNames} from '../../../../utils/JSXRenderUtils';
import PureRenderComponent from '../../../../components/PureRenderComponent';
import {toEmojifyHtml} from '../../../../components/emojify/Emojify';
import {loadEmojiLibPromise} from '../../../../utils/EmojifyUtils';
import {getEmojiResource} from './EmojifyResource';
import RecentEmojiStore,{RECENT_EMOJI_EVENTS} from '../../../../core/stores/RecentEmojiStore';

import './EmojifyPanel.less';
export default class EmojiPanel extends PureRenderComponent {

    static propTypes = {
        onEmoji: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);
        var emojiResourcesJS = getEmojiResource();
        emojiResourcesJS['Recent'] = RecentEmojiStore.getRecentEmojiList();

        this.state = {
            isVisible: false,
            activeGroupName: null,
            emojiResources: emojiResourcesJS,
            emojiGroupNames: Object.keys(emojiResourcesJS)
        };
    }

    /****************************** API Begin *********************************/
    show() {
        this.setState({isVisible: true});
    }

    hide() {
        this.setState({isVisible: false});
    }

    /****************************** API End *********************************/
    componentDidMount() {
        //加载一下Emoji的资源,但是本组件用不到.
        loadEmojiLibPromise();
    }

    componentWillMount() {
        RecentEmojiStore.on(RECENT_EMOJI_EVENTS.CHANGE_RECENT_EMOJI, this._handleRecentEmojiChange);
    }

    componentWillUnmount() {
        RecentEmojiStore.off(RECENT_EMOJI_EVENTS.CHANGE_RECENT_EMOJI, this._handleRecentEmojiChange);
    }


    _handleRecentEmojiChange = ()=>{
        var recentEmoji = RecentEmojiStore.getRecentEmojiList();
        var emojiResources = this.state.emojiResources;
        emojiResources["Recent"] = recentEmoji;
        emojiResources = Object.assign({},emojiResources);
        this.setState({emojiResources:emojiResources});
    };

    onSwitchEmojiTab(groupName) {
        this.setState({
            activeGroupName: groupName
        });
    }

    onClickEmojify(e) {
        var target = e.target;
        var targetClassName = target.className || '';
        var targetClassNameArray = targetClassName.split(' ');
        if (targetClassNameArray.indexOf('emoji32') >= 0) {
            var dataset = target.dataset;
            var name = dataset['name'];
            if (name) {
                this.props.onEmoji(name);
            }
        }
    }


    _preventDefault(e){
        e.preventDefault();
        return false;
    }

    toEmojifyListHTML(groupName) {

        var emojiResources = this.state.emojiResources;
        var emojifyList = emojiResources[groupName];
        var htmlList = emojifyList.map(function (name, i) {
            return toEmojifyHtml(name, 'emoji32');
        });
        return htmlList.join('');
    }

    render() {

        var that = this;
        var state = that.state;
        var {isVisible,emojiResources,emojiGroupNames} = state;

        var activeGroupName = this.state.activeGroupName || emojiGroupNames[1]; //默认选中第二个Tab

        var emojifyPanelClass = classNames({
            'emojifyPanel':true,
            'emojifyPanelVisible':isVisible
        });

        return (
            <div className={emojifyPanelClass} onMouseDown={that._preventDefault} onContextMenu={that._preventDefault}>

                <div className="tabList">
                    {
                        emojiGroupNames.map(function (groupName, i) {
                            var btnClass = classNames({
                                tabButton: true,
                                active: activeGroupName === groupName
                            });
                            var tabIconClass ='tab-icon tab-icon-' + groupName;
                            return  (
                                <div className={btnClass}
                                     key={i}
                                     onClick={that.onSwitchEmojiTab.bind(that,groupName)}>
                                    <div className={tabIconClass}></div>
                                </div>);
                        })
                    }
                </div>

                <div className="tabContentList" onClick={that.onClickEmojify.bind(that)}>
                    {
                        emojiGroupNames.map(function (groupName, i) {
                            var contentClass = classNames({
                                tabContent: true,
                                active: activeGroupName === groupName
                            });
                            var html = that.toEmojifyListHTML(groupName);
                            return (
                                <div className={contentClass} key={i} dangerouslySetInnerHTML={{__html:html}}>
                                </div>
                            )
                        })
                    }
                </div>

            </div>
        );
    }
}
