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
    public class LogsController : Controller
    {
        private fiz_markerspaceEntities db = new fiz_markerspaceEntities();
        // GET: Logs
        public ActionResult View_Logs()
        {
            dynamic View_Logs_Model = new ExpandoObject();
            View_Logs_Model.Machine_Logs = db.MachineLogs.ToList();
            View_Logs_Model.Service_Logs = db.ServiceLogs.ToList();
            return View(View_Logs_Model);
        }

        // GET: MachineLog/Details
        public ActionResult Machine_Log_Details(Guid? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            MachineLog machineLog = db.MachineLogs.Find(id);
            if (machineLog == null)
            {
                return HttpNotFound();
            }
            return View(machineLog);
        }

        // GET: ServiceLog/Details
        public ActionResult Service_Log_Details(Guid? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            ServiceLog serviceLog = db.ServiceLogs.Find(id);
            if (serviceLog == null)
            {
                return HttpNotFound();
            }
            return View(serviceLog);
        }

        public ActionResult Remove_Machine_Log(Guid? id)
        {
            MachineLog machineLog = db.MachineLogs.Find(id);
            db.MachineLogs.Remove(machineLog);
            db.SaveChanges();
            return RedirectToAction("View_Logs");
        }

        public ActionResult Remove_Service_Log(Guid? id)
        {
            ServiceLog serviceLog = db.ServiceLogs.Find(id);
            db.ServiceLogs.Remove(serviceLog);
            db.SaveChanges();
            return RedirectToAction("View_Logs");
        }
    }
}