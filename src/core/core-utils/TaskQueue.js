

export class TaskQueue {
    constructor(runner,timeSpace) {
        this.queue = [];
        this.runner = runner;
        this.isRunning = false;
        this.timeIntervalHandler = 0;
        this.timeSpace = timeSpace;
    }

    pushTask(task) {
        var that = this;
        that.queue.push(task);

        if(!that.isRunning){
            that.isRunning = true;
            that.timeIntervalHandler = setInterval(function () {
                that.runner(that);
            }, that.timeSpace);
        }
    }

    getAllTask() {
        return this.queue;
    }

    clearTask() {
        this.queue = [];
    }
}