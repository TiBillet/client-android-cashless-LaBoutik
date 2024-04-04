FROM ubuntu:22.04

# base
RUN apt-get update \
    && apt-get install ca-certificates curl gnupg wget unzip sudo nano iputils-ping gcc g++ make apt-transport-https -yq

# java
RUN apt-get install openjdk-11-jdk-headless -yq

ARG GRADLE_VERSION=7.6.3
ARG ANDROID_CMDTOOLS_VERSION=9477386

ENV JAVA_HOME /usr/lib/jvm/java-11-openjdk-amd64
ENV GRADLE_USER_HOME /opt/gradle
ENV ANDROID_SDK_ROOT /usr/local/android-sdk-linux
ENV ANDROID_HOME $ANDROID_SDK_ROOT
ENV PATH $PATH:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$GRADLE_USER_HOME/bin

# Gradle
RUN curl -so /tmp/gradle-${GRADLE_VERSION}-bin.zip https://downloads.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip && \
    unzip -qd /opt /tmp/gradle-${GRADLE_VERSION}-bin.zip && \
    ln -s /opt/gradle-${GRADLE_VERSION} /opt/gradle


# Android
RUN curl -so /tmp/commandlinetools-linux-${ANDROID_CMDTOOLS_VERSION}_latest.zip https://dl.google.com/android/repository/commandlinetools-linux-${ANDROID_CMDTOOLS_VERSION}_latest.zip && \
    mkdir -p $ANDROID_SDK_ROOT/cmdline-tools/ && \
    unzip -qd $ANDROID_SDK_ROOT/cmdline-tools/ /tmp/commandlinetools-linux-${ANDROID_CMDTOOLS_VERSION}_latest.zip && \
    mv $ANDROID_SDK_ROOT/cmdline-tools/cmdline-tools $ANDROID_SDK_ROOT/cmdline-tools/latest

COPY android.packages android.packages
RUN ( sleep 5 && while [ 1 ]; do sleep 1; echo y; done ) | sdkmanager --package_file=android.packages

# node.js, npm et cordova
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /usr/share/keyrings/nodesource.gpg \
    && NODE_MAJOR=20 \
    && echo "deb [signed-by=/usr/share/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt update \
    && apt install nodejs -y\
    && npm install -g --unsafe-perm cordova@12.0.0 \
    && apt-get autoremove -y \
    && apt-get clean \

WORKDIR /

# projet
RUN cordova create mobile-app coop.tibillet.laboutik TibilletLaBoutik \
    && cd mobile-app \
    && cordova plugin add cordova-plugin-android-permissions \
    && cordova plugin add cordova-plugin-device \
    && cordova plugin add phonegap-nfc-api31 \
    && cordova plugin add cordova-plugin-networkinterface \
    && cordova plugin add cordova-plugin-file \
    && cordova platform add android@12.0.1 \
    && cordova platform add browser@6.0.0

WORKDIR /mobile-app