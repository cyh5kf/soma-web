import React from 'react';
import MessageItemBase from './MessageItemBase';

import './LocationMessageItem.less';

export default class LocationMessageItem extends MessageItemBase {
    cls = 'location-msg';

    handleClick = () => {
        const {message: msg} = this.props;
        window.open(`http://www.google.com/maps/place/${msg.latitude},${msg.longitude}`)
    };

    getMenuConfigs() {
        const {locale} = this.props;
        return [
            {key: MessageItemBase.MENU_FORWARD, label: locale['chat_forward']}
        ];
    }

    renderContent() {
        const {message} = this.props,
            [locationTitle, locationSubtitle] = message.pointName.split(','),
            locationThumbnail = `http://maps.googleapis.com/maps/api/staticmap?key=AIzaSyA1nbIlxrhDz3f3PzbbS8cuY40kLh862KQ`
                + `&center=${message.latitude},${message.longitude}&zoom=18&scale=1&size=200x200&format=png&maptype=roadmap`;
        return (
            <div className="message-item-content" onClick={this.handleClick}>
                <img className="location-thumbnail" src={locationThumbnail}/>
                <div className="location-desc">
                    <div className="location-desc-title">{locationTitle}</div>
                    <div className="location-desc-subtitle">{locationSubtitle}</div>
                </div>
            </div>
        );
    }
}
