using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Web;
using System.Dynamic;
using System.Web.Mvc;
using FIZ_Markerspace.Models;

namespace FIZ_Markerspace.Controllers
{
    public class UsersController : Controller
    {
        private fiz_markerspaceEntities db = new fiz_markerspaceEntities();

        // GET: Users
        public ActionResult View_Users()
        {
            return View(db.Users.ToList());
        }

        // GET: Users/Details/5
        public ActionResult User_Details(Guid? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            User user = db.Users.Find(id);
            dynamic User_Details_Model = new ExpandoObject();
            User_Details_Model.user = user;
            User_Details_Model.room_access = db.RoomAccesses.All(room => room.user_id == user.user_id);
            if (user == null)
            {
                return HttpNotFound();
            }
            return View(user);
        }

        // GET: Users/Create
        public ActionResult Create_User()
        {
            return View();
        }

        // POST: Users/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details see https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        public JsonResult Create_User(string AUTH_WSU_ID, string AUTH_PASSWORD, string WSU_ID, string RFID_TAG, string FIRST_NAME, string LAST_NAME, int ROLE, int EXP_LEVEL, string PASSWORD, string CREATION_DATE, string EST_GRAD_DATE)
        {
            //Authentication User Data
            User auth_user = db.Users.SingleOrDefault(user => user.wsu_id == AUTH_WSU_ID);
            //Check if WSU ID and RFID exits
            User check_exist_wsuid = db.Users.SingleOrDefault(user => user.wsu_id == WSU_ID);
            User check_exist_rfid = db.Users.SingleOrDefault(user => user.rfid_tag == RFID_TAG);

            //check exisitance
            if (check_exist_wsuid != null)
            {
                var return_data = new { result = false, message = "This WSU ID already exists!" };
                return Json(return_data, JsonRequestBehavior.AllowGet);
            }
            if (check_exist_rfid != null)
            {
                var return_data = new { result = false, message = "This RFID already exists!" };
                return Json(return_data, JsonRequestBehavior.AllowGet);
            }

            //set password to null if student
            if(ROLE == 1)
            {
                PASSWORD = null;
            }

            if ((auth_user != null && auth_user.password == AUTH_PASSWORD))
            {
                User user = new User();

                if(auth_user.role >= ROLE)
                {
                    user.user_id = Guid.NewGuid();
                    user.wsu_id = WSU_ID;
                    user.rfid_tag = RFID_TAG;
                    user.first_name = FIRST_NAME;
                    user.last_name = LAST_NAME;
                    user.role = ROLE;
                    user.exp_level = EXP_LEVEL;
                    user.password = PASSWORD;
                    user.creation_date = CREATION_DATE;
                    user.est_grad_date = EST_GRAD_DATE;

                    db.Users.Add(user);
                    db.SaveChanges();


                    var return_data = new { result = true, message = "You added " + FIRST_NAME + " " + LAST_NAME + "!" };
                    return Json(return_data, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    var return_data = new { result = false, message = "You do not have permission to add this user!" };
                    return Json(return_data, JsonRequestBehavior.AllowGet);
                }

            }
            else
            {
                var return_data = new { result = false, message = "Your authentication credentials failed!" };
                return Json(return_data, JsonRequestBehavior.AllowGet);
            }

        }

        // GET: Users/Edit/5
        public ActionResult Edit_User(Guid? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            User user = db.Users.Find(id);
            if (user == null)
            {
                return HttpNotFound();
            }
            return View(user);
        }

        // POST: Users/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details see https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        public JsonResult Edit_User(string AUTH_WSU_ID, string AUTH_PASSWORD, Guid USER_ID, string WSU_ID, string RFID_TAG, string FIRST_NAME, string LAST_NAME, int ROLE, int EXP_LEVEL, string PASSWORD, string CREATION_DATE, string EST_GRAD_DATE)
        {
            //Authentication User Data
            User auth_user = db.Users.SingleOrDefault(user => user.wsu_id == AUTH_WSU_ID);
            User _user = db.Users.Find(USER_ID);
            //Check if WSU ID and RFID exits
            User check_exist_wsuid = db.Users.SingleOrDefault(user => user.wsu_id == WSU_ID);
            User check_exist_rfid = db.Users.SingleOrDefault(user => user.rfid_tag == RFID_TAG);

            //check exisitance
            //if user changes their wsu id, but one exisits already for new number
            if ((check_exist_wsuid != null) && (WSU_ID != _user.wsu_id))
            {
                return null;
            }
            //if user changes their rfid, but one exisits already for new number
            if ((check_exist_rfid != null) && (RFID_TAG != _user.rfid_tag))
            {
                return null;
            }

            //set password to null if student
            if (ROLE == 1)
            {
                PASSWORD = null;
            }

            if ((auth_user != null && auth_user.password == AUTH_PASSWORD))
            {
                User user = db.Users.Find(USER_ID);

                if (auth_user.role >= ROLE)
                {
                    user.wsu_id = WSU_ID;
                    user.rfid_tag = RFID_TAG;
                    user.first_name = FIRST_NAME;
                    user.last_name = LAST_NAME;
                    user.role = ROLE;
                    user.exp_level = EXP_LEVEL;
                    user.password = PASSWORD;
                    user.creation_date = CREATION_DATE;
                    user.est_grad_date = EST_GRAD_DATE;

                    db.Entry(user).State = EntityState.Modified;
                    db.SaveChanges();

                    return Json(user);
                }

            }
            var return_data = new { result = false, message = "Somthing went wrong!" };
            return Json(return_data, JsonRequestBehavior.AllowGet);
        }


        public ActionResult Add_To_Room(Guid? id)
        {
            dynamic Add_To_Room_Model = new ExpandoObject();
            Add_To_Room_Model.Rooms = db.Rooms.ToList();
            Add_To_Room_Model.User = db.Users.Find(id);
            return View(Add_To_Room_Model);
        }

        [HttpPost]
        public JsonResult Add_To_Room(string AUTH_WSU_ID, string AUTH_PASSWORD, Guid USER_ID, string WSU_ID, string FIRST_NAME, string LAST_NAME, int ROLE, int EXP_LEVEL, string ROOM_NAME)
        {
            //Authentication User Data
            User auth_user = db.Users.SingleOrDefault(user => user.wsu_id == AUTH_WSU_ID);
            //Room Data
            Room findroom = db.Rooms.SingleOrDefault(room => room.room_name == ROOM_NAME);
            //Check if already exisits
            RoomAccess check_roomAccess = db.RoomAccesses.SingleOrDefault(room => room.room_name == ROOM_NAME && room.user_id == USER_ID);

            //check exisitance
            if (check_roomAccess != null)
            {
                var return_data = new { result = false, message = "This WSU ID already has access to this room!" };
                return Json(return_data, JsonRequestBehavior.AllowGet);
            }

            if ((auth_user != null) && (auth_user.password == AUTH_PASSWORD) && (auth_user.exp_level >= 3))
            {
                RoomAccess roomAccess = new RoomAccess();

                roomAccess.room_access_id = Guid.NewGuid();
                roomAccess.room_id = findroom.room_id;
                roomAccess.room_name = findroom.room_name;
                roomAccess.user_id = USER_ID;
                roomAccess.wsu_id = WSU_ID;
                roomAccess.first_name = FIRST_NAME;
                roomAccess.last_name = LAST_NAME;
                roomAccess.role = ROLE;
                roomAccess.exp_level = EXP_LEVEL;

                db.RoomAccesses.Add(roomAccess);
                db.SaveChanges();

                var return_data = new { result = true, message = "You added " + FIRST_NAME + " " + LAST_NAME + "!" };
                return Json(return_data, JsonRequestBehavior.AllowGet);
            }

            else
            {
                var return_data = new { result = false, message = "Your authentication credentials failed!" };
                return Json(return_data, JsonRequestBehavior.AllowGet);
            }
        }

        // GET: Users/Delete/5
        public ActionResult Delete_User(Guid? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            User user = db.Users.Find(id);
            if (user == null)
            {
                return HttpNotFound();
            }
            return View(user);
        }

        public JsonResult Delete_Helper(string AUTH_WSU_ID, string AUTH_PASSWORD, string WSU_ID)
        {
            //Authentication User Data
            User auth_user = db.Users.SingleOrDefault(user => user.wsu_id == AUTH_WSU_ID);
            //Check if WSU ID and RFID exits
            User check_exist_wsuid = db.Users.SingleOrDefault(user => user.wsu_id == WSU_ID);

            if(check_exist_wsuid == null || auth_user == null)
            {
                var return_data = new { result = false, message = "Your authentication credentials failed!" };
                return Json(return_data, JsonRequestBehavior.AllowGet);
            }
            if((check_exist_wsuid != null) && (auth_user != null) && (auth_user.password == AUTH_PASSWORD))
            {
                if(auth_user.role >= check_exist_wsuid.role)
                {
                    DeleteConfirmed(check_exist_wsuid.user_id);
                    var return_data = new { result = true, message = "The selected user has been deleted!" };
                    return Json(return_data, JsonRequestBehavior.AllowGet);
                }
                return null;
            }
            else
            {
                var return_data = new { result = false, message = "Your authentication credentials failed!" };
                return Json(return_data, JsonRequestBehavior.AllowGet);
            }
        }

        // POST: Users/Delete/5
        [HttpPost, ActionName("Delete_User")]
        [ValidateAntiForgeryToken]
        public ActionResult DeleteConfirmed(Guid id)
        {
            User user = db.Users.Find(id);
            db.Users.Remove(user);
            db.SaveChanges();
            return RedirectToAction("View_Users");
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
