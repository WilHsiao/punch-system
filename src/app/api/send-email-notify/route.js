// /app/api/send-email-notify/route.js
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
  return NextResponse.json({ message: '郵件 API 正常運作' });
}

export async function POST(request) {
  try {
    console.log('收到發送郵件請求');
    const body = await request.json();
    const { to, subject, text } = body;
    console.log('郵件參數:', { to, subject, textLength: text?.length });

    // 驗證請求參數
    if (!to || !subject || !text) {
      return NextResponse.json(
        { error: '缺少必要參數: to, subject, 或 text' },
        { status: 400 }
      );
    }

    // 檢查環境變數
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('缺少環境變數: GMAIL_USER 或 GMAIL_APP_PASSWORD');
      return NextResponse.json(
        { error: '郵件服務未正確配置' },
        { status: 500 }
      );
    }

    console.log('準備使用郵件帳號:', process.env.GMAIL_USER);

    // 設置 Nodemailer 郵件傳輸
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // 郵件選項
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to,
      subject,
      text,
    };

    console.log('開始發送郵件...');
    // 發送郵件
    const info = await transporter.sendMail(mailOptions);
    console.log('郵件發送成功:', info.messageId);

    return NextResponse.json({
      success: true,
      message: '郵件成功發送',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('發送郵件時發生錯誤:', error);
    return NextResponse.json(
      {
        error: `發送郵件失敗: ${error.message}`,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}