ขอบคุณครับท่าน Senior! โครงสร้างโค้ด PHP ของคุณชัดเจนมากครับ

เพื่อให้ระบบ Join-IT ทราบทันทีที่มีการ `INSERT` งานใหม่ ผมขอแนะนำให้เพิ่มฟังก์ชัน **Webhook Call** เข้าไปต่อจากบรรทัดที่ `$stmt->execute()` ทำงานสำเร็จครับ

นี่คือแนวทางการปรับปรุงโค้ดฝั่ง PHP ของคุณครับ:

### 1. เพิ่มฟังก์ชัน Helper สำหรับส่ง Webhook
วางไว้ส่วนบนหรือในไฟล์รวมฟังก์ชันของโปรเจกต์คุณครับ:

```php
/**
 * ฟังก์ชันส่งสัญญาณไปยังระบบ Intern (Join-IT)
 */
function sendJoinItNotification($deviceName, $report, $createBy) {
    $url = 'http://localhost:5000/api/webhooks/task-created'; // URL ของโปรเจกต์ Join-IT
    $secret = 'join-it-secret-2026'; // ต้องตรงกับใน .env ของ Join-IT

    $payload = json_encode([
        'deviceName' => $deviceName,
        'report'     => $report,
        'username'   => $createBy,
        'time'       => date('H:i') . ' น.'
    ]);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-Webhook-Secret: ' . $secret
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 3); // Timeout 3 วินาทีเพื่อไม่ให้หน่วงหน้าเว็บหลัก
    
    $response = curl_exec($ch);
    curl_close($ch);
}
```

### 2. นำไปแทรกในโค้ดเดิมของคุณ
แทรกเข้าไปในบล็อก `if ($stmt->execute())` ครับ:

```php
// ... โค้ดส่วนบนของคุณ ...

        if ($stmt->execute()) {
            
            // ✅ แทรกตรงนี้: ส่งแจ้งเตือนไปยังระบบ Intern ทันที
            sendJoinItNotification($deviceName, $report, $create_by);

            $data_report_id = $conn->lastInsertId();
            
            // ... โค้ดส่วน routine_template และอื่นๆ ของคุณ ...

            $_SESSION['success'] = "เพิ่มงานเรียบร้อยแล้ว";
            header("location: ../dashboard.php");
        } else {
// ... โค้ดส่วนล่างของคุณ ...
```

### ทำไมถึงควรทำแบบนี้?
1.  **Instant Notification**: ทันทีที่ DB ของ Order-IT บันทึกสำเร็จ เด็ก Intern จะเห็น Toast เด้งขึ้นมาทันที (ประมาณ 1-2 วินาที)
2.  **No Lag**: การใช้ `CURLOPT_TIMEOUT` จะช่วยให้หน้าเว็บ PHP ของคุณไม่ต้องรอผลตอบกลับจาก Node.js นานเกินไป หากระบบแจ้งเตือนขัดข้อง หน้าเว็บหลักของคุณจะยังทำงานต่อได้ปกติครับ

ท่าน Senior ลองนำไปปรับใช้ได้เลยครับ หากต้องการให้ผมช่วยเขียนเวอร์ชันที่ดึงค่าจาก `.env` ฝั่ง PHP ด้วย บอกได้เลยนะครับ!